
(function(){
	var ctor=function(){};
	var Class=function(){
		
	}
	var fnTest = /xyz/.test(function(){
		xyz;
	}) ? /\b_super\b/ : /.*/;
	Class.prototype._constructor=Object;
	Class.prototype.constructor=Class;
	Class.extend=function(props){
		var ParentClass=this;
		
		var Constructor=function(){
			this._constructor.apply(this, arguments);
		};
		if(props.hasOwnProperty('constructor'))
			props._constructor=props.constructor;
		
		ctor.prototype=ParentClass.prototype;
		Constructor.prototype=new ctor();
		//_.extend(Constructor.prototype,props);
		//*
		_.each(props,function(val,key){
			Constructor.prototype[key]= (
				//если функция и не конструктор
				typeof val =='function' &&
				//и не конструктор
				//конструкторы передаются в чистом виде, иначе ими нельзя создать объект
				typeof val.prototype._constructor == 'undefined' &&
				//и не Observable
				val._notSimple===undefined&&
				//и содержит _super
				fnTest.test(val.toString())) ? (function(key,func){
				return function(){
					
					var oldSuper=this._super;
					this._super=ParentClass.prototype[key];
					var result=func.apply(this, arguments);
					this._super=oldSuper;
					return result;
				};
			
				
				
			})(key,val): val;
		});//*/
		
		Constructor.prototype.constructor=Constructor;
		Constructor.extend = ParentClass.extend;
		Constructor.create = ParentClass.create;
		return Constructor;
		
	};
	
	
	
	Class.create=function(proto){	
		var args=_.toArray(arguments);
		args.shift();
		var child=this.extend(proto);
		var fnBody='return new child(';
		var len=args.length;
		var keys=['child'];
		var vals=[child];
		if(len>0)
		{
			for(var i=0;i<len;i++)
			{
				fnBody+='arg'+i+', ';
				keys.push('arg'+i);
				vals.push(args[i]);
			}
			fnBody=fnBody.substr(0,fnBody.length-2);
		}
		fnBody+=');';
		keys.push(fnBody);
		var instance;
		try {
			instance=Function.apply(undefined,keys).apply(undefined, vals)
		} catch (exception) { 
			throw exception;
		}
		
		return instance;
	};
	this.Class=Class;
})();
(function(){
	var eventSplitter = /\s+/;
	var namespaceSplitter = '.';
	if(!Array.prototype.indexOf)
		Array.prototype.indexOf = function (searchElement, fromIndex ) {
			return _.indexOf(this, searchElement, fromIndex);
		};
	
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

	function makeBind(event, fn, context,isSignal) {
		var bind = parse(event);
		bind.fn = fn;
		bind.c = context;
		bind.s=isSignal;
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

	var findBinds = function (binds, event, fn, context, mode) {
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

	var remove=function (event, fn, context) {
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
	
	var Events=Class.extend({
		on: function(events, fn, context){
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
		},
		off: function(events, fn, context) {
			if(!events) {
				remove.call(this, '', fn, context);
				return this;
			}
			var aEvents = events.split(eventSplitter), i, l;
			for(i = 0, l = aEvents.length; i < l; i++) {
				remove.call(this, aEvents[i], fn, context)
			}
			return this;
		},
		fire: function(events) {
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
					if(bind.s)
						this.off(undefined, bind.fn)
					//args.unshift(aEvents[i]);
					bind.fn.apply(bind.c, args);
				//args.shift();
				}
			}

			return this;
		},
		one: function(events, fn, context) {
			var aEvents = events.split(eventSplitter), i, bind;
			if(typeof fn != 'function') {
				throw TypeError('function expected');
			}

			if(!context) {
				context = this;
			}
			for(i = aEvents.length - 1; i >= 0; i--) {
				bind = makeBind(aEvents[i], fn, context,true);
				add(this, bind);
			}
			return this;
		},
		hasListener : function(event) {
			if(!this._listeners) {
				return false;
			}
			return findBinds(this._listeners, event, false, false, 'any');
		}
	});
	Events.prototype.trigger = Events.prototype.fire;
	this.Events=Events;
})();
(function(){
	var modelsMap={};
	
	var Model=Events.extend({
		constructor: function(data){
			data||(data={});
			this.attributes=_.extend({},this.defaults,this.parse(data));
			this._changed={};
			this.id=this.attributes[this.idAttribute];
			this.cid=_.uniqueId('c');
			//заносим в глобальную коллекцию
			if(this.mapping&&this.id)
			{
				modelsMap[this.mapping]||(modelsMap[this.mapping]={});
				modelsMap[this.mapping][this.id]=this;
			}
			this.initialize();
		},
		initialize: function(){
			return this;
		},
		idAttribute: 'id',
		mapping: false,
		defaults: {},
		toJSON: function(){
			return _.clone(this.attributes);
		},
		parse: function(json) {
			return json;
		},
		baseURL: '/',
		url: function(){
			var mapping=this.mapping?this.mapping+'/':'';
			var id=this.id?this.id+'/':''
			return this.baseURL+mapping+id;
		},
		update: function(json){
			this.prop(this.parse(json));
			this._changed = {};
			return this;
		},
		prop: function(key){
			if(arguments.length==1&&typeof key=='string')
			{
				return this.attributes[key];
			}
			var values={};
			if(typeof key=='string')
				values[key]=arguments[1];
			else
				values=key;
			var self=this;
			_.each(values,function(val,key){
				self._changed[key]=self.attributes[key]=val;
				if(key==self.idAttribute)
				{
					self.id=val;
				}
				self.fire('change:'+key);
			});
			this.fire('change');
			return this;
		},
		/**
		 * DEPRECATED since 26.01.2013
		 */
		get: function(key){
			return this.prop.apply(this, arguments);
		},
		/**
		 * синоним для prop
		 */
		set: function(){
			return this.prop.apply(this, arguments);
		},
		validate : function() {
			return true;
		},
		fetch: function(options){
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
			var resOpt = _.extend({}, options, opt);
			Model.sync('read', this.url(), resOpt);
			return this;
		},
		save: function(){
			var me = this;
			if(!this.validate())
				throw new Error('Model is invalid');
			if(this.id) {
				if(_.keys(me._changed).length==0)//нечего сохранять
					return this;
				Model.sync('update', this.url(), {
					data: me._changed,
					success: function(data) {
						me.update(data);
					}
				});
			} else {
				Model.sync('create', this.url(), {
					data: _.clone(this.attributes),
					success: function(data) {
						me.update(data);
					}
				});
			}
			return this;
		},
		remove: function() {
			this.fire('remove');
			if(this.id) {
				Model.sync('delete', this.url(),{});
			}
		}
	});
	
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
	
	Model.sync=function(method,url,options){
		options||(options={});
		var data={
			method: method
		}
		if(method=='PUT')
			method='POST';
		$.extend(data, options.data);
		$.ajax({
			url: url,
			dataType: 'json',
			type: method,
			data: data,
			success: options.success,
			error: options.error
		})
	}
	
	this.Model = Model;
})();

(function(){
	var itself=function(self){
		this.self=self;
	}
	var Collection=Model.extend({
		
		constructor: function(models,attributes)
		{
			//Model.call(this,attributes);
			//this._super(attributes);
			this.itself=new itself(this);
			this.models=[];
			this.length=0;
			
			if(models&&models.length)
			{
				this.reset(models);
			}
			this.initialize();
			
		},
		models: [],
		model: Model,
		url: function(){
			return this.baseURL+this.model.prototype.mapping+'/';
		},
		fetch: function(options){
			var me=this;
			options||(options={});
			var opt={
				success: function(data){
					me.reset(data,options);
					if(typeof options.success == 'function')
					{
						options.success.apply(me,arguments);
					}
				},
				error: function(){
					if(typeof options.error == 'function')
					{
						options.error.apply(me,arguments);
					}
				}
			}
			var resOpt=_.extend({},options,opt);
			Model.sync('GET', this.url(), resOpt);
		},
		reset: function(json,options){
			options||(options={});
			if(!options.add)
			{
				this.models=[];
				this.length=0;
			}
			if(!json)
			{
				this.fire('reset');
				return;
			}
				
				
			var modelsArr=this.parse(json);
			
			if(modelsArr instanceof Array)
			{
				for(var i=0,l=modelsArr.length;i<l;i++)
				{
					this.add(modelsArr[i],'end',true);
				}
				if(options.add)
					this.fire('add',modelsArr,0);
				else
					this.fire('reset');
			}
			else
			{
				this.add(modelsArr,'end',true);
				if(options.add)
					this.fire('add',[modelsArr],0);
				else
					this.fire('reset');
			}
		},
		push: function(model){
			return this.add(model);
		},
		unshift: function(model){
			return this.add(model,0);
		},
		add: function(model,index,silent){
			typeof index=='number'||(index=this.length);
			if(!(model instanceof Model))
			{
				model=Model.createOrUpdate(this.model, model);
			}
			var me=this;
			model.one('remove',function(){
				me.cutByCid(this.cid);
			})
			this.models.splice(index, 0, model);
			this.length=this.models.length;
			if(!silent)
				this.fire('add',[model],index);
			return this;
		},
		cut: function(id){
			var found;
			this.each(function(model,index){
				if(model.id==id)
				{
					found=this.cutAt(index);
					return false;
				}
			})
			return found;
		},
		cutByCid: function(cid){
			var found;
			var self=this;
			this.each(function(model,index){
				if(model.cid==cid)
				{
					found=self.cutAt(index);
					return false;
				}
			})
			return found;
		},
		shift: function(){
			return this.cutAt(0);
		},
		pop: function(){
			return this.cutAt();
		},
		cutAt: function(index){
			index!==undefined||(index=this.models.length-1);
			var model=this.models.splice(index, 1)[0];
			this.length=this.models.length;
			this.fire('cut',model,index);
			return model;
		},
		at: function(index){
			return this.models[index];
		},
		/**
		 * DEPRECATED since 26.01.2013
		 */
		get: function(){
			return this.getByID.apply(this, arguments);
		},
		getByID: function(id){
			var found;
			this.each(function(model){
				if(model.id==id)
				{
					found=model;
					return false;
				}
			})
			return found;
		},
		getByCid: function(cid){
			var found;
			this.each(function(model){
				if(model.cid==cid)
				{
					found=model;
					return false;
				}
			})
			return found;
		}
	});
	
	// Underscore methods that we want to implement on the Collection.
	var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
	'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
	'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortByDesc', 'sortedIndex',
	'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
	'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];
	
	// An internal function to generate lookup iterators.
	var lookupIterator = function(value) {
		return _.isFunction(value) ? value : function(obj){
			return obj[value];
		};
	};

	// Sort the object's values by a criterion produced by an iterator.
	_.sortByDesc = function(obj, value, context) {
		var iterator = lookupIterator(value);
		return _.pluck(_.map(obj, function(value, index, list) {
			return {
				value : value,
				index : index,
				criteria : iterator.call(context, value, index, list)
			};
		}).sort(function(left, right) {
			var a = left.criteria;
			var b = right.criteria;
			if (a !== b) {
				if (a > b || a === void 0) return -1;
				if (a < b || b === void 0) return 1;
			}
			return left.index < right.index ? -1 : 1;
		}), 'value');
	};
	
	// Mix in each Underscore method as a proxy to `Collection#models`.
	_.each(methods, function(method) {
		Collection.prototype[method] = function() {
			return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
		};
	});
	
	var filterMethods = ['filter', 'reject'];
	var sortMethods = ['sortBy','sortByDesc','shuffle'];

	_.each(filterMethods, function(method) {
		itself.prototype[method] = function() {
			var antonym=method=='filter'?'reject':'filter';
			var self=this.self;
			var newModels=_[method].apply(_, [self.models].concat(_.toArray(arguments)));
			var rejectedModels=_[antonym].apply(_, [self.models].concat(_.toArray(arguments)));
			var indexes={};
			_.each(rejectedModels,function(model){
				indexes[self.indexOf(model)]=model;
			});
			self.models=newModels;
			self.length=newModels.length;
			//console.log(indexes);
			self.fire('reject', indexes);
			return self;
		};
	});
	
	_.each(sortMethods, function(method) {
		itself.prototype[method] = function() {
			var self=this.self;
			var newModels=_[method].apply(_, [self.models].concat(_.toArray(arguments)));
			var indexes={};
			_.each(newModels,function(model,index){
				indexes[self.indexOf(model)]=index;
			});
			self.models=newModels;
			self.length=newModels.length;
			//console.log(indexes);
			self.fire('sort', indexes);
			return self;
		};
	});
	
	this.Collection=Collection;
})();
(function(){
	(function() {
		var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame || window.msRequestAnimationFrame 
		|| (function(){
			var calls=[];
			var timoutIsset=false;
			return function(callback){
				calls.push(callback);
				if(!timoutIsset)
				{
					setTimeout(function(){
						_.each(calls,function(c){
							c();
						});
						calls=[];
						timoutIsset=false;
					}, 1000/60);
				}	
			};
		})();
		window.requestAnimationFrame = requestAnimationFrame;
	})();
	
	var Subscribeable=function(fn){
		fn._listeners=[];
		fn.subscribe=function(callback){
			fn._listeners.push(callback);
		}
		fn.unsubscribe=function(callback){
			for(var i=0,l=fn._listeners.length;i<l;i++)
				if(fn._listeners[i]===callback)
					fn._listeners.splice(i, 1);
		}
		fn.fire=function(){
			for(var i=0,l=fn._listeners.length;i<l;i++)
				fn._listeners[i].call(fn);
		}
		fn._notSimple=true;
		return fn;
	}
	var computedInit=false;
	
	var Observable=function(initial)
	{
		var value=initial;
		var fn=function(set){
			if(arguments.length>0)
			{
				if(value!==set||_.isObject(set))
				{
					fn.lastValue=value;
					value=set;
					fn.fire();
				}
			}
			else if(computedInit)
			{
				computedInit.subscribeTo(fn);
			}
			return value;
		}
		Subscribeable(fn);
		
		fn.lastValue=undefined;
		fn.valueOf=fn.toString=function(){
			return this();
		}
		fn.__observable=true;
		return fn;
	}
	Observable.isObservable=function(fn){
		if(typeof fn != 'function')
			return false;
		return fn.__observable||false;
	}
	
	var Computed=function(fn,context,async){
		
		var value=fn.call(context);
		
		var resfn=function(){
			//console.log(computableInit);
			if(computedInit)
			{
				computedInit.subscribeTo(resfn);
			}
			return value;
		}
		var waitForUpdate=false;
		resfn.async=async||false;
		resfn.subscribeTo=function(obs)
		{
			obs.subscribe(function(){
				resfn.refresh();
				if(resfn.async)
				{
					if(!waitForUpdate)
					{
						waitForUpdate=true;
						window.requestAnimationFrame(function(){
							resfn.fire();
							waitForUpdate=false;
						});
					}
				}
				else
				{
					resfn.fire();
				}
			});
		}
		Subscribeable(resfn);
		resfn.refresh=function(){
			value=fn.call(context);
		}
		
		
		resfn.__observable=true;
		
		resfn.valueOf=resfn.toString=function(){
			return this();
		}
		computedInit=resfn;
		fn.call(context);
		computedInit=false;
		return resfn;
	}
	
	
	
	this.Observable=Observable;
	this.Computed=Computed;
	this.Subscribeable=Subscribeable;
})();

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
	
	ViewModel.compAsync=true;
	
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
		var comp;
		var obs = fnEval();
		if(ViewModel.compAsync)
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
			addArgs||(addArgs={});
			var fn = function() {
				$el.hide().empty();
				var array = fArray();
				if(array) {
					$.each(array, function(ind, val) {
						addArgs.$index=ind;
						addArgs.$parent=array;
						addArgs.$value=val;
						var tempDiv = document.createElement('div');
						$(tempDiv).html(html);
						ViewModel.findBinds(tempDiv, val, addArgs);
						var $children = $(tempDiv).children();
						$children.appendTo(elem);
					});
				}
				$el.show();
			};
			fn();
			fArray.subscribe(fn);
			return false;
		},
		eachModel: function(elem, value, context, addArgs) {
			var collectionObs=this.findObservable(context, value, addArgs);
			var html = $(elem).html();
				
			var rebindCollection=function(collection){
				var i = 0;
				addArgs||(addArgs={});
				var renderModel = function(model, index) {
					var tempDiv = document.createElement('div');
					$(tempDiv).html(html);
					
					//model.__index__ = collection.getIndex(model);

					var obs = Observable(model);
					addArgs.$index=index;
					addArgs.$parent=collection;
					ViewModel.findBinds(tempDiv, obs, addArgs);

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
				$(elem).show();
			}
				
				
			var fn=function(){
				$(elem).hide();
				$(elem).empty();
				var collection = collectionObs();
				if(collection)
				{
					rebindCollection(collection);
				}
			}
			fn();
			collectionObs.subscribe(fn);
				
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
				(function(elem,attr,comp){
					var fn=function(){
						$(elem).attr(attr,comp());
					}
					fn();
					comp.subscribe(fn);
				})(elem,arr[1],comp);
			}
		},
		style: function(elem, value, context, addArgs) {
			value = value.match(/^{([\s\S]+)}$/)[1];
			var attrs = value.split(/\s*,\s*/);
			for(var i = attrs.length - 1; i >= 0; i--) {
				var arr = attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);

				var comp = ViewModel.findObservable(context, arr[2], addArgs);
				(function(elem,attr,comp){
					var fn=function(){
						$(elem).css(attr,comp());
					}
					fn();
					comp.subscribe(fn);
				})(elem,arr[1],comp);
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
		click: function(elem, value, context,addArgs) {
			var fn = this.findObservable(context, value, addArgs)();
			var $el = $(elem);
			$el.click(function() {
				fn.apply(context,arguments);
			});
		}
	};
})();