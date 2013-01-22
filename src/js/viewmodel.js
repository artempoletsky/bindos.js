(function() {
	var $ = this.$;

	var eventSplitter = /\s+/;
	var bindSplitter = /\s*;\s*/;
	var simpleTagRegex = /^[a-z]+$/;

	ViewModel.extend = Model.extend;
	ViewModel.findObservable = function(context, string, addArgs) {
		if(Observable.isObservable(context)) {
			context = context();
		}
		var keys=VM.keys(addArgs);
			
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

	function ViewModel(options) {
		//для подсказок
		if(false)
		{
			Events.call(this);
			this._binds={};
			this.events={};
			this.attributes={};
			this._cid='';
			this.$el=$();
			this.el=document.createElement('div');
		}
		options||(options={});
		this.options=options;
		this.collection=options.collection;
		this.model=options.model;
		if(options.el)
			this.el=options.el;
		var me=this;
		if(!me._cid)
		{
			me._cid=VM.unique('vm');
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
	}

	ViewModel.prototype = new Events();
	ViewModel.prototype.constructor = ViewModel;
	ViewModel.prototype.setElement = function(el) {
		this.undelegateEvents();
		this.el = el;
		this.$el = $(el);
		this.parse().delegateEvents();
		return this;
	};
	ViewModel.prototype.remove = function() {
		this.$el.remove();
		return this;
	};
	ViewModel.prototype.parse = function() {
		delete this._binds;
		ViewModel.findBinds(this.el, this);
		return this;
		var $el,binds,bind,me=this,i,context=me;
		me.$el.find('[data-bind]').add(me.$el).filter('[data-bind]').each(function(){
			$el=$(this);
			binds=$el.attr('data-bind').split(bindSplitter);
			for(i=binds.length-1;i>=0;i--){
				
				var arr=binds[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
					
				var fn=ViewModel.binds[arr[1]];
				
				if(fn)
				{
					fn.call(me, this,arr[2], context)	
				}

			//bind=parseBind(binds);
			//me.addBind(bind.a, bind.b);
			}
		});
		return this;
	}
	ViewModel.prototype.bindToModel = function(json) {
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
	}
		
	ViewModel.prototype.autoinit=false;
	ViewModel.prototype.initialize=function(){};
	ViewModel.prototype.delegateEvents=function(events){
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
			eventName = eventsPath.shift() + '.' + this._cid;

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
	}
	ViewModel.prototype.undelegateEvents = function() {
		this.$el.unbind('.' + this._cid);
		return this;
	}

	ViewModel.prototype.render = function() {
		return this;
	};
	this.ViewModel = ViewModel;
}).call(this);