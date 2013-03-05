(function() {
	"use strict";
	var $ = this.$;

	var eventSplitter = /\s+/;
	var bindSplitter = /\s*;\s*/;
	var simpleTagRegex = /^[a-z]+$/;
	var firstColonRegex=/^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*$/;
	var breakersRegex=/^{([\s\S]*)}$/;
	var commaSplitter=/\s*,\s*/
	
	var ViewModel={
		setElement : function(el) {
			this.undelegateEvents();
			this.el = el;
			this.$el = $(el);
			this.parse().delegateEvents();
			return this;
		},
		constructor: function(options){
			options||(options={});
			this.options=options;
			if(options.collection)
				this.collection=options.collection;
			this.model=options.model;
			if(options.el)
				this.el=options.el;
			var me=this;
			if(!me._cid)
			{
				me._cid=_.uniqueId('vm');
			}
			if(!me.el)
				me.el='div';
			if(typeof me.el == 'string')
			{
				if(simpleTagRegex.test(me.el)&&me.el!='html'&&me.el!='body')
					me.el=document.createElement(me.el);
				else
					me.el=$(me.el)[0];
			}
			me.$el=$(me.el);
			me.$=function(selector){
				return me.$el.find(selector);
			}
			me.initialize();

			if(me.autoParseBinds)
				me.parse();
			me.delegateEvents();
		},
		remove: function() {
			this.$el.remove();
			return this;
		},
		parse: function(){
			ViewModel.findBinds(this.el, this);
			return this;
		},
		bindToModel: function(json) {
			var oModel = Observable(new Model(json));
			var model = oModel();
			var doReplace = true;
			var ctx = {};

			var replace = function(newModel) {
				if(model) {
					model.off(0, 0, ctx);
				}
				model = newModel;
				if(newModel) {
					newModel.on('change', function() {
						doReplace = false;
						oModel.fire();
						doReplace = true;
					}, ctx);
				}
			};
			replace(model);
			oModel.subscribe(function() {
				if(doReplace) {
					replace(this());
				}
			});
			if(!this._bindedToModel) 
				for(var prop in model.attributes) {
					this[prop] = (function(prop, context) {

						return Computed(function() {

							var mod = oModel();
							if(!mod) {
								return '';
							}
							return mod.prop(prop);

						}, context)
					})(prop, this);
				}
			this._bindedToModel=true;
			return oModel;
		},
		autoParseBinds: false,
		initialize: function(){},
		delegateEvents: function(events){
			events||(events=this.events);
			this.undelegateEvents();
			var fnName, fn, name, eventsPath, eventName, me = this;
			for(name in events) {

				fnName = events[name];
				//если это простая функция, содержится в VM или глобальная функция
				fn = (typeof fnName == 'function')?fnName: me[fnName]||Function('return '+fnName)();
				if(typeof fn != 'function') {
					throw TypeError(fnName + ' is not a function');
				}
				eventsPath = name.split(eventSplitter);
				//меняем запятые в имени события на пробелы и неймспейс
				eventName = eventsPath.shift().split(',').join('.' + me._cid+' ') + '.' + me._cid;
				
				var proxy = (function(fn) {
					return function() {
						fn.apply(me, arguments);
					}
				})(fn);
				
				if(eventsPath.length) {
					me.$el.delegate(eventsPath.join(' '), eventName, proxy);
				} else {
					me.$el.bind(eventName, proxy);
				}
			}
			return this;
		},
		undelegateEvents : function() {
			this.$el.unbind('.' + this._cid);
			return this;
		},
		render: function() {
			return this;
		}
	};
	ViewModel=Events.extend(ViewModel);
	
	ViewModel.compAsync=true;
	
	ViewModel.findObservable = function(context, string, addArgs) {
		addArgs||(addArgs={});
		if(Observable.isObservable(context)) {
			context = context();
		}
		var keys=_.keys(addArgs);
			
		var vals=[];
		for(var i=0,l=keys.length;i<l;i++)
		{
			vals[i]=addArgs[keys[i]];
		}
		keys.push('with(this) return '+string+'');
		var fn=Function.apply(context,keys);
		var fnEval = function() {
			try {
				return fn.apply(context, vals);
			} catch(exception) {
				console.log('Error "' + exception.message + '" in expression "' + string + '" Context: ', context);
			}
		}
		var comp;
		var obs = fnEval();
		//если уже асинхронный, то возвращаем его
		if(this.compAsync&&obs&&!obs.async)
		{
			if(Observable.isObservable(obs)) {
				comp=Computed(function(){
					return obs();
				},context,true);
			}
			else
			{
				comp = Computed(function() {
					return fnEval();
				}, context,true);	
			}
		}
		else
		{
			
			if(Observable.isObservable(obs)) {
				comp=obs;
			}
			else
				comp = Computed(function() {
					return fnEval();
				}, context);
			
			
		}
		return comp;
	}
	
	ViewModel.findBinds = function(element, context, addArgs) {
		var children, curBindsString, binds, i, newctx,l,cBind,bindName,bindVal;
		var $el=$(element);
		curBindsString = $el.attr('data-bind');
		$el.removeAttr('data-bind');

		if(curBindsString) {
			binds = curBindsString.split(bindSplitter);
			for(i=0, l=binds.length; i < l; i++) {
				cBind=binds[i];
				if(!cBind||cBind.charAt(0)=='!')
					continue;
				var arr = cBind.match(firstColonRegex);
				if(!arr)
				{
					bindName=cBind;
					bindVal='';
				}
				else
				{
					bindName=arr[1];
					bindVal=arr[2];
				}
				
				var bindFn = ViewModel.binds[bindName];
				
				if(bindFn) {
					newctx = bindFn.call(this, element, bindVal, context, addArgs);
					if(newctx === false) {
						return;
					} else if(newctx) {
						context = newctx;
					}
				}
				else
				{
					console.warn('Bind: "'+bindName+'" not exists')
				}

			}
		}
		if(element) {
			children = $el.children();
			for(i=0, l=children.length; i < l; i++) {
				this.findBinds(children[i], context, addArgs);
			}
		}
	};
	
	ViewModel.parseOptionsObject=function(value){
		var val=value;
		if(!val)
			return {};
		
		var match= val.match(breakersRegex)
		//console.log(match);
		if(!match||match[1]===undefined)
			throw new Error('Expression: "'+value+'" is not valid object');
		val = match[1];	
		
		
		var attrs = val.split(commaSplitter);
		//console.log(attrs);
		if(!attrs.length)
			return {};
		
		var res={};
		_.each(attrs,function(val){
			
			if(!val)
				return;
			match = val.match(firstColonRegex);
			
			if(!match||!match[1]||!match[2])
			{
				throw new Error('Expression: "'+value+'" is not valid object');
			}
			res[match[1]]=match[2];
		});
		return res;
	};
	
	this.ViewModel = ViewModel;
}).apply(this);