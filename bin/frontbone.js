(function(undefined) {
	(function IE() {
		if(!Array.prototype.indexOf) {
			Array.prototype.indexOf = function(searchElement /*, fromIndex */) {
				"use strict";
				if(this == null) {
					throw new TypeError();
				}
				var t = Object(this);
				var len = t.length >>> 0;
				if(len === 0) {
					return -1;
				}
				var n = 0;
				if(arguments.length > 1) {
					n = Number(arguments[1]);
					if(n != n) { // shortcut for verifying if it's NaN
						n = 0;
					} else {
						if(n != 0 && n != Infinity && n != -Infinity) {
							n = (n > 0 || -1) * Math.floor(Math.abs(n));
						}
					}
				}
				if(n >= len) {
					return -1;
				}
				var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
				for(; k < len; k++) {
					if(k in t && t[k] === searchElement) {
						return k;
					}
				}
				return -1;
			}
		}
	})();

	(function() {
		var singleExtend = function(obj1, obj2) {
			for(var prop in obj2) {
				if(ob2.hasOwnProperty(prop)) {
					obj1[prop] = obj2[prop];
				}
			}
		}
		var unique = {};
		var VM = {
			extend: function() {
				var i;
				for(i = arguments.lengthi; i > 0; i--) {
					singleExtend(arguments[0], arguments[i]);
				}
				return arguments[0]
			},
			keys: function(obj) {
				var arr = [];
				for(var prop in obj) {
					arr.push(prop);
				}
				return arr;
			},
			unique: function(prefix) {
				prefix = '' + prefix;
				if(!unique[prefix]) {
					unique[prefix] = 0;
				}
				unique[prefix]++;
				return prefix + unique[prefix];
			},
			sync: function(method, url, options) {
				options || (options = {});

				var data = {
					method: method
				}
				if(method == 'PUT') {
					method = 'POST';
				}
				$.extend(data, options.data);
				$.ajax({
					url: url + '&' + Math.random(),
					dataType: 'json',
					type: method,
					data: data,
					success: options.success,
					error: options.error
				})
			}
		};
		this.VM = VM;
	}).call(this);

	(function() {
		var Events = function() {};
		var eventSplitter = /\s+/;
		var namespaceSplitter = '.';

		function parse(event) {
			var arr = ('' + event).split(namespaceSplitter);
			return {
				n: arr[0],
				ns: arr.slice(1),
				o: event
			}
		}

		function compareNames(arr1, arr2) {
			for(var i = arr1.length - 1; i >= 0; i--) {
				if(!~arr2.indexOf(arr1[i])) {
					return false;
				}
			}
			return true;
		}

		function compareBinds(bind1, bind2, nsInvert) {
			if(bind1.n && bind1.n != bind2.n) {
				return false;
			}
			if(bind1.fn && bind1.fn !== bind2.fn) {
				return false;
			}

			if(bind1.c && bind1.c !== bind2.c) {
				return false;
			}
			if(bind1.ns.length && !compareNames(bind1.ns, bind2.ns)) {
				return false;
			}
			return true;
		}

		function makeBind(event, fn, context) {
			var bind = parse(event);
			bind.fn = fn;
			bind.c = context;
			return bind;
		}

		function add(self, bind) {
			var binds, curBind;

			binds = self._listeners || {}

			curBind = binds[bind.n] || [];

			curBind.push(bind);

			binds[bind.n] = curBind;

			self._listeners = binds;
		}

		function findBinds(binds, event, fn, context, mode) {
			var result = [], a, b, bind = makeBind(event, fn, context);
			if(!mode) {
				mode = 'filter';
			}

			for(a in binds) {

				for(b = binds[a].length - 1; b >= 0; b--) {
					if(compareBinds(bind, binds[a][b])) {
						if(mode == 'filter') {
							result.push(binds[a][b]);
						} else {
							if(mode == 'any') {
								return true;
							}
						}
					} else {
						if(mode == 'invert') {
							result.push(binds[a][b]);
						}
					}

				}
			}
			if(mode != 'any') {
				return result;
			} else {
				return false;
			}
		}

		function remove(event, fn, context) {
			var bind, binds, i;
			if(!this._listeners) {
				return;
			}
			if(!event && !fn && !context) {
				delete this._listeners;
				return;
			}

			bind = makeBind(event, fn, context);

			if(!bind.ns.length && !fn && !context) {
				delete this._listeners[bind.n];
				return;
			}

			binds = findBinds(this._listeners, event, fn, context, 'invert');

			delete this._listeners;
			for(i = binds.length - 1; i >= 0; i--) {
				add(this, binds[i])
			}
		}

		Events.prototype.on = function(events, fn, context) {
			var aEvents = events.split(eventSplitter), i, bind;
			if(typeof fn != 'function') {
				throw TypeError('function expected');
			}

			if(!context) {
				context = this;
			}
			for(i = aEvents.length - 1; i >= 0; i--) {
				bind = makeBind(aEvents[i], fn, context);
				add(this, bind);
			}
			return this;
		}
		Events.prototype.off = function(events, fn, context) {
			if(!events) {
				remove.call(this, '', fn, context);
				return this;
			}
			var aEvents = events.split(eventSplitter), i, l;
			for(i = 0, l = aEvents.length; i < l; i++) {
				remove.call(this, aEvents[i], fn, context)
			}
			return this;
		}
		Events.prototype.fire = function(events) {
			if(!this._listeners) 
				return this;
			var args = Array.prototype.slice.call(arguments,1);
			
			var aEvents,i,j,l,binds,bind,type;
			aEvents=typeof events == 'string'? events.split(eventSplitter): [events];
		
			for(i=0,l=aEvents.length;i<l;i++)
			{
				type=typeof aEvents[i] == 'string'? aEvents[i]: aEvents[i].type;
			
				binds=findBinds(this._listeners,type,false,false);
				
				for(j=binds.length-1;j>=0;j--)
				{
					bind=binds[j];
					
					//args.unshift(aEvents[i]);
					bind.fn.apply(bind.c, args);
				//args.shift();
				}
			}

			return this;
		}
		Events.prototype.trigger = Events.prototype.fire;
		Events.prototype.one = function(events, fn, context) {
			var proxy = function() {
				this.off(events, proxy, context);
				fn.apply(this, arguments);
			}
			return this.on(events, proxy, context);
		}
		Events.prototype.hasListener = function(event) {
			if(!this._listeners) {
				return false;
			}
			return findBinds(this._listeners, event, false, false, 'any');
		}
		this.Events = Events;

	}).call(this);

	(function() {
		function isObj() {
			for(var i = arguments.length - 1; i >= 0; i--) {
				if(arguments[i] !== Object(arguments[i])) {
					return false;
				}
			}
			return true;
		}

		function compare(o1, o2) {
			if(o1 === o2) {
				return true;
			}
			var propsChecked = {};
			var hasProps = false;
			if(isObj(o1, o2)) {
				for(var prop in o1) {
					if(o1.hasOwnProperty(prop)) {
						propsChecked[prop] = true;
						hasProps = true;
						if(!compare(o1[prop], o2[prop])) {
							return false;
						}
					}

				}
				for(prop in o2) {
					if(propsChecked[prop]) {
						continue;
					}

					if(o2.hasOwnProperty(prop)) {
						hasProps = true;
						if(!compare(o1[prop], o2[prop])) {
							return false;
						}
					}
				}
				if(!hasProps) {
					return true;
				}
			} else {
				return false;
			}
			return true;
		}

		var Subscribeable = function(fn) {
			fn._listeners = [];
			fn.subscribe = function(callback) {
				fn._listeners.push(callback);
			}
			fn.unsubscribe = function(callback) {
				for(var i = 0, l = fn._listeners.length; i < l; i++)
					if(fn._listeners[i] === callback) {
						fn._listeners.splice(i, 1);
					}
			};
			fn.fire = function() {
				for(var i = 0, l = fn._listeners.length; i < l; i++)
					fn._listeners[i].call(fn);
			};
			return fn;
		}
		var computableInit=false;
	
		var Observable=function(initial)
		{
			var value=initial;
			var fn=function(set){
				if(arguments.length>0)
				{
				//if(!compare(set, value))
				{
					fn.lastValue=value;
					value=set;
					fn.fire();
				}
				}
				else
				{
					if(computableInit)
					{
						(function(comp){
						
							fn.subscribe(function(){
								comp.refresh();
								comp.fire();
							})
						})(computableInit);
					}
				}
				return value;
			};
			fn.lastValue = undefined;
			fn.valueOf = fn.toString = function() {
				return this();
			};
			fn.destroy = function() {
				delete value;
				delete fn._listeners;
				delete fn.lastValue;
			}
			Subscribeable(fn);
			fn.__observable = true;
			return fn;
		};
		Observable.isObservable = function(fn) {
			if(typeof fn != 'function') {
				return false;
			}
			return fn.__observable || false;
		}
	
		var Computed=function(fn,context){
			if(!context)
				context=this;
			var value=fn.call(context);
		
			var resfn=function(){
				if(computableInit)
				{
					(function(comp){
						
						resfn.subscribe(function(){
							comp.refresh();
							comp.fire();
						})
					})(computableInit);
				}
				return value;
			};

			computableInit = resfn;
			fn.call(context);
			computableInit = false;
			Subscribeable(resfn);
			resfn.refresh = function() {
				value = fn.call(context);
			};
			resfn.__observable = true;

			resfn.valueOf = resfn.toString = function() {
				return this();
			};
			return resfn;
		};

		this.Observable = Observable;
		this.Computed = Computed;
		this.Subscribeable = Subscribeable;
	}).call(this);
	
	
	
	(function(){
		var modelsMap={};
		function Model(data,options){
			data||(data={});
			options||(options={});
			var attrs={};
			$.extend(attrs,this.defaults,this.parse(data));
			this.attributes=attrs;
			this._changed={};
			this.id=this.attributes[this.idAttribute];
			this.cid=VM.unique('c');
		
			if(this.mapping&&this.id)
			{
				modelsMap[this.mapping]||(modelsMap[this.mapping]={});
				modelsMap[this.mapping][this.id]=this;
			}
			this.initialize();
		}

		// Shared empty constructor function to aid in prototype-chain creation.
		var ctor = function() {};

		Model.extend = function(props) {
			var ParentClass = this;
			var Constructor = (props && props.hasOwnProperty('constructor')) ? props.constructor : function() {
				ParentClass.apply(this, arguments);
			};

			ctor.prototype = ParentClass.prototype;
			Constructor.prototype = new ctor();

			$.extend(Constructor.prototype, props);
			Constructor.prototype.constructor = Constructor;
			Constructor.extend = ParentClass.extend;
			return Constructor;
		}
		Events.extend=Model.extend;
		Model.prototype=new Events();
		Model.prototype.constructor=Model;
		
		Model.prototype.idAttribute='id';
		Model.prototype.mapping=false;
		Model.prototype.defaults={};
		Model.prototype.toJSON=function(){
			return _.clone(this.attributes);
		};
		Model.prototype.initialize=function(){
			return this;
		};
		Model.prototype.parse = function(json) {
			return json;
		};
		Model.prototype.fetch = function(options) {
			var me = this;
			options || (options = {});
			var opt = {
				success: function(data) {
					me.update(data);
					if(typeof options.success == 'function') {
						options.success.apply(me, arguments);
					}
				},
				error: function() {
					if(typeof options.error == 'function') {
						options.error.apply(me, arguments);
					}
				}
			};
			var resOpt = {};
			$.extend(resOpt, options, opt);
			VM.sync('GET', this.url, resOpt);
			return this;
		};
		Model.prototype.update = function(json) {
			this.set(this.parse(json));
			this._changed = {};
		};
		Model.prototype.get = function(name) {
			return this.attributes[name];
		};
		Model.prototype.validate = function() {
			return true;
		};
		Model.prototype.save = function() {
			var me = this;
			if(this.id) {
				VM.sync('PUT', this.url, {
					data: this._changed,
					success: function(data) {
						me.update(data);
					}
				});
			} else {
				VM.sync('POST', this.url, {
					data: this.attributes,
					success: function(data) {
						me.update(data);
					}
				});
			}
			return true;
		};
		Model.prototype.remove = function() {
			this.fire('remove');
			if(this.id) {
				VM.sync('DELETE', this.url);
			}
		};
		Model.prototype.set = function(name, value) {
			var attrs = {}, prop;
			if(arguments.length > 1) {
				attrs[name] = value;
			} else {
				attrs = name;
			}
			var changed = {};
			for(prop in attrs) {
				if(prop == this.idAttribute) {
					this.id = attrs[prop];
				}
				this.attributes[prop] = attrs[prop];
				changed[prop] = attrs[prop];
				this.fire('change:' + prop);
			}
			this._changed = changed;
			this.fire({
				type: 'change',
				changed: changed
			});
			return this;
		};
		Model.fromStorage = function(name, id) {
			modelsMap[name] || (modelsMap[name] = {});
			return modelsMap[name][id];
		};
		Model.createOrUpdate = function(constuctor, json) {
			var proto = constuctor.prototype, fromStorage, idAttr, parsed, id;
			if(proto.mapping) {
				idAttr = proto.idAttribute;
				parsed = proto.parse(json);
				fromStorage = Model.fromStorage(proto.mapping, parsed[idAttr]);
				if(fromStorage) {
					fromStorage.update(json);
					return fromStorage;
				}
			}
			return new constuctor(json);
		}
		this.Model = Model;
	})();

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

	(function() {
		function Collection(models, options) {
			this.models = [];
			this.length = 0;


			// хэш вида  id : глобальный индекс
			this._hashId = [];
			if(models) {
				this.reset(models);
			}
			this.initialize(options);
		}

		(function(Collection) {
			Collection.prototype = new Events();
			Collection.prototype.constructor = Collection;
			Collection.extend = Model.extend;
			Collection.prototype.model = Model;
			Collection.prototype.initialize = function() {
				return this;
			};
			Collection.prototype.fetch = function(options) {
				var me = this;
				options || (options = {});
				var opt = {
					success: function(data) {
						me.reset(data, options);

						if(typeof options.success == 'function') {
							options.success.apply(me, arguments);
						}
					},
					error: function(jqXHR, textstatus, error) {
						if(typeof options.error == 'function') {
							options.error.apply(me, arguments);
						}
					}
				};
				var resOpt = {};
				$.extend(resOpt, options, opt);
				VM.sync('GET', this.url, resOpt);
				return this;
			};
			Collection.prototype.parse = function(json) {
				return json;
			}
			Collection.prototype.reset=function(json,options){
				options||(options={});
				if(!options.add)
				{
					this.models=[];
					this.length=0;
				}
					
				var modelsArr=this.parse(json);
				if(modelsArr instanceof Array)
				{
					for(var i=0,l=modelsArr.length;i<l;i++)
					{
						this.add(modelsArr[i]);
					}
				} else {
					this.add(modelsArr);
				}
				if(!options.add) {
					this.fire('reset');
				} else {
					this.fire('addScope');
				}
			};
			Collection.prototype.indexOf = function(model) {
				return this.models.indexOf(model);
			};
			Collection.prototype.add = function(model, index) {
				if(!(model instanceof Model) && typeof(model.models) == 'undefined') {
					model = Model.createOrUpdate(this.model, model);
				}


				// добавляем элемент в хэш глобальных индексов коллекции
				var hashIndex;

				// добавление в начало хэша и конец
				if ( index === 0 && this.length ) {
					// берем наименьший порядковый индекс из первого элемента хэша
					hashIndex = this._hashId[0].index - 1;
					// добавляем элемент в начало хэша
					this._hashId.unshift({
						id: model.id,
						index: hashIndex
					});
				}
				else {
					var length = this._hashId.length;
					// проверка для пустого хэша
					if ( length === 0 ) {
						hashIndex = 1;
					}
					else {
						// берем порядковый индекс из последнего элемента в хэше
						hashIndex = this._hashId[length - 1].index + 1;
					}
					// добавляем элемент в конец хэша
					this._hashId.push({
						id: model.id,
						index: hashIndex
					});
				}

				var me = this;
				model.one('remove', function() {
					me.cutByCid(this.cid);
				});
				var global_index = 0;
				if(typeof(index) == 'undefined') {
					if(this.models.length) {
						global_index = this.getIndex(this.models[this.models.length - 1]) + 1;
					}
					model.__global_index__ = global_index;
					this.models.push(model);
				} else {
					if(this.models.length) {
						global_index = this.models[0].__global_index__ - 1;
					}
					model.__global_index__ = global_index;
					this.models.splice(index, 0, model);
				}
				this.fire('add', model, this.models.indexOf(model));
				this.length = this.models.length;
			};
			/**
			 * Возвращает порядковый номер модели с id из хеша
			 * @param id идентификатор трека
			 * @return {Number} порядковый номер в плейлисте
			 */
			Collection.prototype.getIndexById = function( id ){
				var i = 0,
				length = this._hashId.length;
				for(; i < length; i++) {
					if (this._hashId[i].id === id) {
						return this._hashId[i].index;
					}
				}
				return 0;
			};
			/**
			 * Возвращение порядкового индекса по модели
			 * @param model
			 * @return {Number}
			 */
			// TODO: протестировать скорость относительно getIndexById
			Collection.prototype.getIndex = function( model ) {
				var i = this.indexOf(model);
				return this._hashId[i].index;
			};
			Collection.prototype.cut = function(id) {
				var found;
				this.each(function(model, index) {
					if(model.id == id) {
						found = this.cutAt(index);
						return false;
					}
				});
				return found;
			};
			Collection.prototype.cutByCid = function(cid) {
				var found;
				this.each(function(model, index) {
					if(model.cid == cid) {
						found = this.cutAt(index);
						return false;
					}
				});
				return found;
			};
			Collection.prototype.cutAt = function(index) {
				var model = this.models.splice(index, 1)[0];

				// удаление элемента из хеша
				this._hashId.splice(index, 1);

				if(model) {
					model.fire('cut', this);
					this.length = this.models.length;
					return model;
				} else {
					return false;
				}
			};
			Collection.prototype.at = function(index) {
				return this.models[index];
			};
			Collection.prototype.each = function(callback) {
				var isBreak;
				for(var i = 0, l = this.models.length; i < l; i++) {
					isBreak = callback.call(this, this.models[i], i);
					if(isBreak === false) {
						break;
					}
				}
				return this;
			};
			Collection.prototype.get = function(id) {
				var found;
				this.each(function(model) {
					if(model.id == id) {
						found = model;
						return false;
					}
				});
				return found;
			};
			Collection.prototype.getByCid = function(cid) {
				var found;
				this.each(function(model) {
					if(model.cid == cid) {
						found = model;
						return false;
					}
				});
				return found;
			};
			Collection.prototype.remove = function(id) {
				var model = this.cut(id);
			};
		})(Collection);

		this.Collection = Collection;
	})();

	(function() {
		ViewModel.binds = {
			log: function(elem, value, context, addArgs) {
				var comp = this.findObservable(context, value, addArgs);
				console.log(context, '.', value, '=', comp());
			},
			html: function(elem, value, context, addArgs) {
				var comp = this.findObservable(context, value, addArgs);
				var fn = function() {
					$(elem).html(comp());
				}
				fn();
				comp.subscribe(fn);
			},
			text: function(elem, value, context, addArgs) {
				var comp = this.findObservable(context, value, addArgs);
				var fn = function() {
					$(elem).text(comp());
				}
				fn();
				comp.subscribe(fn);
			},
			'with': function(elem, value, context, addArgs) {
				return this.findObservable(context, value, addArgs)();
			},
			each: function(elem, value, context, addArgs) {
				var fArray = this.findObservable(context, value, addArgs);
				var $el = $(elem);
				var html = $el.html();
				$el.hide().empty();
				var fn = function() {
					$el.hide().empty();
					var array = fArray();
					if(array) {
						$.each(array, function(ind, val) {
							var tempDiv = document.createElement('div');
							$(tempDiv).html(html);
							ViewModel.findBinds(tempDiv, val);
							var $children = $(tempDiv).children();
							$children.appendTo(elem);
						});
					}
					$el.show();
				};
				fn();
				fArray.subscribe(fn);

			},
			eachModel: function(elem, value, context, addArgs) {
				var collection = this.findObservable(context, value, addArgs)();

				var html = $(elem).html();

				$(elem).empty();
				var i = 0;
				var renderModel = function(model, index) {
					var tempDiv = document.createElement('div');
					$(tempDiv).html(html);
					
					//model.__index__ = collection.getIndex(model);

					var obs = Observable(model);
					ViewModel.findBinds(tempDiv, obs, {
						'$index': collection.getIndex(model),
						'$parent': collection
					});

					var $children = $(tempDiv).children();
					if(index == 0) {
						$children.prependTo(elem);
					} else if($children.length && $(elem).children().eq(index*$children.length).length) {
						$children.insertBefore($(elem).children().eq(index*$children.length));
					} else {
						$children.appendTo(elem);
					}

					var ctx = {};
					model.on('change',function(e) {
						obs.fire();
					}, ctx).on('cut',function(from) {
						if(from === collection) {
							$children.empty().remove();
							collection.fire('cut', model);
						}
						model.off(0, 0, ctx);
						obs.destroy();
						delete obs;
					}, ctx);
					i++;
				};
				if(collection.length) {
					collection.each(renderModel)
				}
				collection.on('add', renderModel);
				return false;
			},
			value: function(elem, value, context, addArgs) {
				var comp = ViewModel.findObservable(context, value, addArgs);
				var fn = function() {
					$(elem).val(comp());
				}
				fn();
				comp.subscribe(fn);
			},
			attr: function(elem, value, context, addArgs) {
				value = value.match(/^{([\s\S]+)}$/)[1];
				var attrs = value.split(/\s*,\s*/);
				for(var i = attrs.length - 1; i >= 0; i--) {
					var arr = attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
					var comp = ViewModel.findObservable(context, arr[2], addArgs);
					var fn = function() {
						$(elem).attr(arr[1], comp());
					}
					fn();
					comp.subscribe(fn);
				}
			},
			style: function(elem, value, context, addArgs) {
				value = value.match(/^{([\s\S]+)}$/)[1];
				var attrs = value.split(/\s*,\s*/);
				for(var i = attrs.length - 1; i >= 0; i--) {
					var arr = attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);

					var comp = ViewModel.findObservable(context, arr[2], addArgs);
					var fn = function() {
						$(elem).css(arr[1], comp());
					}
					fn();
					comp.subscribe(fn);
				}
			},
			css: function(elem, value, context, addArgs) {
				value = value.match(/^{([\s\S]+)}$/)[1];

				var attrs = value.split(/\s*,\s*/);
				for(var i = attrs.length - 1; i >= 0; i--) {
					var arr = attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
					(function(val, className) {
						var comp = ViewModel.findObservable(context, val, addArgs);

						var fn = function() {

							if(comp()) {
								$(elem).addClass(className);
							} else {
								$(elem).removeClass(className);
							}
						}
						fn();
						comp.subscribe(fn);
					})(arr[2], arr[1])

				}
			},
			display: function(elem, value, context, addArgs) {
				var comp = this.findObservable(context, value, addArgs);
				var fn = function() {
					if(comp()) {
						$(elem).show();
					} else {
						$(elem).hide();
					}
				}
				fn();
				comp.subscribe(fn);
			},
			click: function(elem, value_S_T_R_I_N_G, context) {
				var $el = $(elem);

				$el.click(function() {

					with(context) {
						var val = eval(value_S_T_R_I_N_G);
						if(typeof val == 'function') {
							val.call(context);
						}
						}
				});
			}
		};
	})();
})(undefined);