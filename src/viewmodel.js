(function() {
	var $ = this.$;

	var eventSplitter = /\s+/;
	var bindSplitter = /\s*;\s*/;
	var simpleTagRegex = /^[a-z]+$/;
	
	var ViewModel=Events.extend({
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

			if(me.autoinit)
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
							return (this['format_' + prop]) ? this['format_' + prop](mod.get(prop)) : mod.get(prop);

						}, context)
					})(prop, this);
				}
			this._bindedToModel=true;
			return oModel;
		},
		autoinit: false,
		initialize: function(){},
		delegateEvents: function(events){
			events||(events=this.events);
			this.undelegateEvents();
			var fnName, fn, name, eventsPath, eventName, me = this;
			for(name in events) {

				fnName = events[name];
				fn = me[fnName];
				if(typeof fn != 'function') {
					throw TypeError(fnName + ' is not a function');
				}
				eventsPath = name.split(eventSplitter);
				eventName = eventsPath.shift() + '.' + me._cid;
				
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
	});
	

	
	ViewModel.findObservable = function(context, string, addArgs) {
		addArgs||(addArgs={});
		if(Observable.isObservable(context)) {
			context = context();
		}
		var keys=_.keys(addArgs);
			
		var vals=[];
		for(var i=0;i<keys.length;i++)
		{
			vals[i]=addArgs[keys[i]];
		}
		keys.push('with(this) return '+string+'');
			
		var fnEval = function() {
			try {
					
				//with(context)
				return (Function.apply(context,keys)).apply(context, vals);
			//return eval(string);
			} catch(exception) {
				console.log('Error "' + exception.message + '" in expression "' + string + '" Context: ', context);
			}
		}

		var obs = fnEval();
		if(Observable.isObservable(obs)) {
			return obs;
		}

		var comp = Computed(function() {
			return fnEval();
		}, context);

		return comp;
	}
	ViewModel.findBinds = function(element, context, addArgs) {
		var children, curBindsString, binds, i, newctx;

		curBindsString = $(element).attr('data-bind');
		$(element).removeAttr('data-bind');

		if(curBindsString) {
			/*
				 $.each(curBindsString,function(name,val){
				 alert(name+': '+val);
				 })*/
			//alert(curBindsString.value)
			binds = curBindsString.split(bindSplitter);
			for(i = binds.length - 1; i >= 0; i--) {
				var arr = binds[i].match(/^\s*(\S+)\s*:\s*(\S[\s\S]*\S)\s*$/);

				var fn = ViewModel.binds[arr[1]];

				if(fn) {
					newctx = fn.call(this, element, arr[2], context, addArgs);
					if(newctx === false) {
						return;
					} else {
						if(newctx) {
							context = newctx;
						}
					}

				}

			}
		}
		if(element) {
			children = element.childNodes;
			if(children) {
				for(i = children.length - 1; i >= 0; i--) {
					ViewModel.findBinds(children[i], context, addArgs);
				}
			}
		}
	}
	
	this.ViewModel = ViewModel;
})();