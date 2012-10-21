(function(undefined){
	(function IE(){
		if (!Array.prototype.indexOf) {
			Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
				"use strict";
				if (this == null) {
					throw new TypeError();
				}
				var t = Object(this);
				var len = t.length >>> 0;
				if (len === 0) {
					return -1;
				}
				var n = 0;
				if (arguments.length > 1) {
					n = Number(arguments[1]);
					if (n != n) { // shortcut for verifying if it's NaN
						n = 0;
					} else if (n != 0 && n != Infinity && n != -Infinity) {
						n = (n > 0 || -1) * Math.floor(Math.abs(n));
					}
				}
				if (n >= len) {
					return -1;
				}
				var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
				for (; k < len; k++) {
					if (k in t && t[k] === searchElement) {
						return k;
					}
				}
				return -1;
			}
		}
	})();



	(function(){
		var singleExtend=function(obj1,obj2)
		{
			for(var prop in obj2)
			{
				if(ob2.hasOwnProperty(prop))
				{
					obj1[prop]=obj2[prop];
				}
			}
		}
		var unique={};
		var VM={
			extend: function(){
				var i;
				for(i=arguments.lengthi;i>0;i--)
				{
					singleExtend(arguments[0],arguments[i]);
				}
				return arguments[0]
			},
			keys: function(obj)
			{
				var arr=[];
				for(var prop in obj)
				{
					arr.push(prop);
				}
				return arr;
			},
			unique: function(prefix){
				prefix=''+prefix;
				if(!unique[prefix])
					unique[prefix]=0;
				unique[prefix]++;
				return prefix+unique[prefix];
			},
			sync:function(method,url,options){
				//console.log(method);
				options||(options={});
			
				var data={
					method: method
				}
				if(method=='PUT')
					method='POST';
				$.extend(data, options.data);
				$.ajax({
					url: url+'&'+Math.random(),
					dataType: 'json',
					type: method,
					data: data,
					success: options.success,
					error: options.error
				})
			}
		};
		this.VM=VM;
	}).call(this);

	(function(){
		var Events=function(){};
		var eventSplitter=/\s+/;
		var namespaceSplitter='.';
		function parse(event)
		{
			var arr=(''+event).split(namespaceSplitter);
			return {
				n: arr[0], 
				ns: arr.slice(1),
				o: event
			}
		}
		function compareNames(arr1,arr2)
		{
			for(var i=arr1.length-1;i>=0;i--)
			{
				if(!~arr2.indexOf(arr1[i]))
					return false;
			}
			return true;
		}
		function compareBinds(bind1,bind2,nsInvert)
		{
			if(bind1.n && bind1.n != bind2.n)
				return false;
			if(bind1.fn && bind1.fn !== bind2.fn)
				return false;
		
			if(bind1.c && bind1.c !== bind2.c)
				return false;
			if(bind1.ns.length && !compareNames(bind1.ns,bind2.ns))
				return false;
			return true;
		}
		function makeBind(event,fn,context)
		{
			var bind=parse(event);
			bind.fn=fn;
			bind.c=context;
			return bind;
		}
		function add(self,bind){
			var binds,curBind;
		
			binds=self._listeners||{}
		
			curBind=binds[bind.n]||[];
		
			curBind.push(bind);
		
			binds[bind.n]=curBind;
		
			self._listeners=binds;
		}
		function findBinds(binds,event,fn,context,mode)
		{
			var result=[],a,b,bind=makeBind(event,fn,context);
			if(!mode)
				mode='filter';
		
			for(a in binds)
			{
			
				for(b=binds[a].length-1;b>=0;b--)
				{
					//console.log(binds[a][b].ns,bind.ns);
					//console.log(compareBinds(bind,binds[a][b]));
					if(compareBinds(bind,binds[a][b]))
					{
						if(mode=='filter')
							result.push(binds[a][b]);
						else if(mode=='any')
						{
							return true;
						}
					}
					else if(mode=='invert')
					{
						result.push(binds[a][b]);
					}
				
				}
			}
			if(mode!='any')
				return result;
			else
				return false;
		}
		function remove(event,fn,context){
			var bind,binds,i;
			if(!this._listeners)
				return;
			if(!event&&!fn&&!context)
			{
				delete this._listeners;
				return;
			}
		
			bind=makeBind(event,fn,context);
		
			if(!bind.ns.length&&!fn&&!context)
			{
				delete this._listeners[bind.n];
				return;
			}
		
			binds=findBinds(this._listeners,event,fn,context,'invert');
		
			delete this._listeners;
			for(i=binds.length-1;i>=0;i--)
			{
				add(this,binds[i])
			}
		}
	
	
		Events.prototype.on=function(events,fn,context){
			var aEvents=events.split(eventSplitter),i,bind;
			if(typeof fn != 'function')
				throw TypeError('function expected');
		
			if(!context)
				context=this;
			for(i=aEvents.length-1;i>=0;i--)
			{
				bind=makeBind(aEvents[i], fn, context);
				add(this,bind);
			}
			return this;
		}
		Events.prototype.off=function(events,fn,context){
			if(!events)
			{
				remove.call(this,'',fn,context);
				return this;
			}
			var aEvents=events.split(eventSplitter),i,l;
			for(i=0,l=aEvents.length;i<l;i++)
			{
				remove.call(this,aEvents[i],fn,context)
			}
			return this;
		}
		Events.prototype.fire=function(events){ 
			if(!this._listeners)
				return this;
		
			var aEvents,i,j,l,binds,bind,type;
			aEvents=typeof events == 'string'? events.split(eventSplitter): [events];
		
			for(i=0,l=aEvents.length;i<l;i++)
			{
				type=typeof aEvents[i] == 'string'? aEvents[i]: aEvents[i].type;
			
				binds=findBinds(this._listeners,type,false,false);
				//console.log(binds);
				for(j=binds.length-1;j>=0;j--)
				{
					bind=binds[j];
					bind.fn.call(bind.c,aEvents[i]);
				}
			}
		
			return this;
		}
		Events.prototype.one=function(events,fn,context){
			var proxy=function(){
				this.off(events, proxy, context);
				fn.apply(this, arguments);
			}
			return this.on(events, proxy, context);
		}
		Events.prototype.hasListener=function(event){
			if(!this._listeners)
				return false;
			return findBinds(this._listeners,event,false,false,'any');
		}
		this.Events=Events;
	
	}).call(this);

	(function(){
		function isObj(){
			for(var i=arguments.length-1;i>=0;i--)
			{
				if(arguments[i]!==Object(arguments[i]))
					return false;
			}
			return true;
		}
		function compare(o1,o2){
			if(o1===o2)
				return true;
			var propsChecked={};
			var hasProps=false;
			if(isObj(o1,o2))
			{
				for(var prop in o1)
				{
					if(o1.hasOwnProperty(prop))
					{
						propsChecked[prop]=true;
						hasProps=true;
						if(!compare(o1[prop],o2[prop]))
						{
							return false;
						}
					}
						
				}
				for(prop in o2)
				{
					if(propsChecked[prop])
						continue;
				
					if(o2.hasOwnProperty(prop))
					{
						hasProps=true;
						if(!compare(o1[prop],o2[prop]))
						{
							return false;
						}	
					}
				}
				if(!hasProps)
					return true;
			}
			else
			{
				return false;
			}
			return true;
		}
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
			return fn;
		}
		var computableInit=false;
	
		var Observable=function(initial)
		{
			var value=initial;
			var fn=function(set){
				if(arguments.length>0)
				{
					if(!compare(set, value))
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
			}
			fn.lastValue=undefined;
			fn.valueOf=fn.toString=function(){
				return this();
			}
		
			Subscribeable(fn);
			fn.__observable=true;
			return fn;
		}
		Observable.isObservable=function(fn){
			if(typeof fn != 'function')
				return false;
			return fn.__observable||false;
		}
	
		var Computed=function(fn,context){
		
			var value=fn.call(context);
		
			var resfn=function(){
				//console.log(computableInit);
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
			}
		
			computableInit=resfn;
			fn.call(context);
			computableInit=false;
			Subscribeable(resfn);
			resfn.refresh=function(){
				value=fn.call(context);
			}
			resfn.__observable=true;
		
			resfn.valueOf=resfn.toString=function(){
				return this();
			}
			return resfn;
		}
	
	
	
		this.Observable=Observable;
		this.Computed=Computed;
		this.Subscribeable=Subscribeable;
	}).call(this);

	(function(){
		var $=this.$;
	
		var eventSplitter=/\s+/;
		var bindSplitter=/\s*;\s*/;
		var simpleTagRegex=/^[a-z]+$/;
	
		function findBinds(element,vm,context)
		{
			ViewModel.findBinds(element,vm,context);
		}
		ViewModel.findObservable=function(context,string){
			var comp=Computed(function(){
				try {
				
					with(Observable.isObservable(context)?context():context)
						return eval(string);
				} catch (exception) { 
					throw 'Error "'+exception.message+'" in expression "'+string+'"';
				}

			
			},context);
		
			return comp;
		}
		ViewModel.findBinds=function(element,context){
			var children,curBindsString,binds,i,newctx;
			//console.dir(element);
			curBindsString=element.attributes&&element.attributes['data-bind'];
			//console.log(curBindsString);
		
			if(curBindsString)
			{
				binds=curBindsString.value.split(bindSplitter);
				for(i=binds.length-1;i>=0;i--){
				
					var arr=binds[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
				
					var fn=ViewModel.binds[arr[1]];
				
					if(fn)
					{
						newctx=fn.call(this, element, arr[2], context);
						if(newctx===false)
						{
							return;
						}
						else if(newctx)
						{
							context=newctx;
						}
						
					}
				
				}
			}
			children=element.childNodes;
			if(children)
				for(i=children.length-1;i>=0;i--){
					findBinds(children[i],context);
				}
		}
		/**
	 * @return ViewModel
	 */
		ViewModel.create=function(obj){
			var newObj={};
			$.extend(newObj,ViewModel.prototype,obj);
			//console.log(newObj.initialize);
			return newObj._construct();
		}
		function ViewModel() {
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
			this._construct();
		}
		ViewModel.prototype=new Events();
		ViewModel.prototype.addBind=function(attr,element,value){
			var binds,curBind;
			binds=this._binds||(this._binds={});
			curBind=binds[attr]||(binds[attr]=[]);
			curBind.push({
				el: element,
				val: value
			});
			return this;
		}
	
		ViewModel.prototype.setElement=function(el){
			this.undelegateEvents();
			this.el=el;
			this.$el=$(el);
			this.parse().delegateEvents();
			return this;
		}
		ViewModel.prototype.parse=function(){
			delete this._binds;
			findBinds(this.el, this, '');
			return this;
			var $el,binds,bind,me=this,i,context=me;
			me.$el.find('[data-bind]').add(me.$el).filter('[data-bind]').each(function(){
				$el=$(this);
				binds=$el.attr('data-bind').split(bindSplitter);
				for(i=binds.length-1;i>=0;i--){
				
					var arr=binds[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
					//console.log(binds[i]);
					//console.log(arr);
					//console.log(binds[i].match(/^(\S+):/));
				
					var fn=ViewModel.binds[arr[1]];
				
					if(fn)
					{
						fn.call(me, this,arr[2], context)	
					}
				
				//bind=parseBind(binds);
				//me.addBind(bind.a, bind.b);
				}
			})
			return this;
		}
	
		ViewModel.prototype._construct=function(){
			var me=this;
			if(!me._cid)
			{
				me._cid=VM.unique('vm');
			}
		
			if(!me.el)
				me.el='div';
			if(typeof me.el == 'string')
			{
				if(simpleTagRegex.test(me.el))
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
				me.parse().delegateEvents();
			return this;
		}
		ViewModel.prototype.autoinit=true;
		ViewModel.prototype.initialize=function(){}
		ViewModel.prototype.delegateEvents=function(events){
			events||(events=this.events);
			this.undelegateEvents();
			var fnName,fn,name,eventsPath,eventName,me=this;
			for(name in events)
			{
			
				fnName=events[name];
				fn=me[fnName];
				if(typeof fn != 'function')
					throw TypeError(fnName+' is not a function');
				eventsPath=name.split(eventSplitter);
				eventName=eventsPath.shift()+'.'+this._cid;
			
				var proxy=(function(fn){
					return function(){
						fn.apply(me,arguments);
					}
				})(fn);
				if(eventsPath.length)
				{
					me.$el.delegate(eventsPath.join(' '),eventName,proxy);
				}
				else
				{
					me.$el.bind(eventName,proxy);
				}
			}
			return this;
		}
		ViewModel.prototype.undelegateEvents=function(){
			this.$el.unbind('.'+this._cid);
			return this;
		}
	
		ViewModel.prototype.render=function(){
			return this;
		};
		this.ViewModel=ViewModel;
	}).call(this);

	(function(){
		var modelsMap={};
		function Model(json,options){
			json||(json={});
			options||(options={});
			this.attributes=this.parse(json);
			this.id=this.attributes[this.idAttribute];
			this.cid=VM.unique('c');
		
			if(this.mapping&&this.id)
			{
				modelsMap[this.mapping]||(modelsMap[this.mapping]={});
				modelsMap[this.mapping][this.id]=this;
			}
			this.url='api/?model='+this.mapping+'&id='+this.id;
			this.initialize();
		}
		Model.extend=function(props){
			var ParentClass=this.prototype.constructor;
			var Constructor=function(json,options){
				ParentClass.call(this,json,options)
			}
			Constructor.prototype=new ParentClass();
			Constructor.prototype.constructor=Constructor;
			for(var prop in props)
			{
				Constructor.prototype[prop]=props[prop];
			}
			Constructor.extend=ParentClass.extend;
			return Constructor;
		}
		Model.prototype=new Events();
		Model.prototype.constructor=Model;
		Model.prototype.idAttribute='id';
		Model.prototype.mapping=false;
		Model.prototype.initialize=function(){
			return this;
		}
		Model.prototype.parse=function(json){
			return json;
		}
		Model.prototype.update=function(json){
			this.set(this.parse(json));
		}
		Model.prototype.get=function(name){
			return this.attributes[name];
		}
		Model.prototype.validate=function(){
			return true;
		}
		Model.prototype.save=function(){
			var me=this;
			if(this.id)
				VM.sync('PUT', this.url,{
					data: this.attributes
				});
			else
				VM.sync('POST', this.url,{
					data: this.attributes,
					success: function(data){
						me.set('id',data);
						me.id=data;
					}
				});
			return true;
		}
		Model.prototype.remove=function(){
			this.fire('remove');
			if(this.id)
				VM.sync('DELETE', this.url);
		}
		Model.prototype.set=function(name,value){
			var attrs={},prop;
			if(arguments.length>1)
				attrs[name]=value;
			else
				attrs=name;
			var changed={};
			for(prop in attrs)
			{
				this.attributes[prop]=attrs[prop];
				changed[prop]=attrs[prop];
				this.fire('change:'+prop);
			}
			this.fire({
				type: 'change',
				changed:changed
			});
			return this;
		}
		Model.fromStorage=function(name,id){
			modelsMap[name]||(modelsMap[name]={});
			return modelsMap[name][id];
		}
		Model.createOrUpdate=function(constuctor,json){
			var proto=constuctor.prototype,fromStorage,idAttr,parsed,id;
			if(proto.mapping)
			{
				idAttr=proto.idAttribute;
				parsed=proto.parse(json);
				fromStorage=Model.fromStorage(proto.mapping, parsed[idAttr]);
				if(fromStorage)
				{
					fromStorage.update(json);
					return fromStorage;
				}
			}
			return new constuctor(json);
		}
		this.Model=Model;
	})();

	(function(){
		function Collection(json){
			this.models=[];
			this.length=0;
			this.url='api/?model='+this.model.prototype.mapping;
			if(json)
			{
				this.reset(json);
			}
			this.initialize();
		}
		(function(Collection){
			Collection.prototype=new Events();
			Collection.prototype.constructor=Collection;
			Collection.extend=Model.extend;
			Collection.prototype.model=Model;
			Collection.prototype.initialize=function(){
				return this;
			}
			Collection.prototype.fetch=function(options){
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
				var resOpt={};
				$.extend(resOpt,options,opt);
				VM.sync('GET', this.url, resOpt);
			}
			Collection.prototype.parse=function(json){
				return json;
			}
			Collection.prototype.reset=function(json,options){
				options||(options={});
				if(!options.add)
					this.models=[];
				var modelsArr=this.parse(json);
				if(modelsArr instanceof Array)
				{
					for(var i=0,l=modelsArr.length;i<l;i++)
					{
						this.add(modelsArr[i]);
					}
				}
				else
				{
					this.add(modelsArr);
				}
				if(!options.add)
					this.fire('reset');
				else
					this.fire('addScope');
		
			}
			Collection.prototype.add=function(model){
		
				if(!(model instanceof Model))
				{
					model=Model.createOrUpdate(this.model, model);
				}
				var me=this;
				model.one('remove',function(){
					me.cutByCid(this.cid);
				})
				this.models.push(model);
				this.fire({
					type: 'add',
					model: model
				});
			}
			Collection.prototype.cut=function(id){
				var found;
				this.each(function(model,index){
					if(model.id==id)
					{
						found=this.cutAt(index);
						return false;
					}
				})
				return found;
			}
			Collection.prototype.cutByCid=function(cid){
				var found;
				this.each(function(model,index){
					if(model.cid==cid)
					{
						found=this.cutAt(index);
						return false;
					}
				})
				return found;
			}
			Collection.prototype.cutAt=function(index){
				var model=this.models.splice(index, 1)[0];
				this.fire({
					type: 'cut',
					model: model
				})
				return model;
			}
			Collection.prototype.at=function(index){
				return this.models[index];
			}
			Collection.prototype.each=function(callback){
				var isBreak;
				for(var i=0,l=this.models.length;i<l;i++)
				{
					isBreak=callback.call(this,this.models[i],i);
					if(isBreak===false)
						break;
				}
				return this;
			}
			Collection.prototype.get=function(id){
				var found;
				this.each(function(model){
					if(model.id==id)
					{
						found=model;
						return false;
					}
				})
				return found;
			}
			Collection.prototype.getByCid=function(cid){
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
			Collection.prototype.remove=function(id){
				var model=this.cut(id);
			}
		})(Collection)
		
		this.Collection=Collection;
	})();

	(function(){
		ViewModel.binds={
			html: function(elem,value,context){
				var comp=ViewModel.findObservable(context, value);
				var fn=function(){
					$(elem).html(comp());
				}
				fn();
				comp.subscribe(fn);
			},
			'with': function (elem,value,context){
				var comp=ViewModel.findObservable(context, value);
				return comp();
			},
			each: function (elem,value,context){
				var collection=ViewModel.findObservable(context, value)();
			
				var html=$(elem).html();
				$(elem).empty();
			
				collection.on('add',function(e){
					//console.log(e.model);
					var tempDiv=document.createElement('div');
					$(tempDiv).html(html);
					var obs=Observable(e.model);
					ViewModel.findBinds(tempDiv, obs);
					var $children=$(tempDiv).children();
					$children.appendTo(elem);
					e.model.one('remove',function(){
						$children.remove();
					}).on('change',function(e){
						obs.fire();
					})
				});
				return false;
			},
			value: function (elem,value,context){
				var comp=ViewModel.findObservable(context, value);
				var fn=function(){
					$(elem).val(comp());
				}
				fn();
				comp.subscribe(fn);
			},
			attr: function (elem,value,context){
				value=value.match(/^{([\s\S]+)}$/)[1];
				//console.log(context);
				var attrs=value.split(/\s*,\s*/);
				for(var i=attrs.length-1;i>=0;i--)
				{
					var arr=attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
					var comp=ViewModel.findObservable(context, arr[2]);
					var fn=function(){
						$(elem).attr(arr[1],comp());
					}
					fn();
					comp.subscribe(fn);
				}
			},
			style: function (elem,value,context){
				value=value.match(/^{([\s\S]+)}$/)[1];
				//console.log(context);
				var attrs=value.split(/\s*,\s*/);
				for(var i=attrs.length-1;i>=0;i--)
				{
					var arr=attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
					//console.log(arr);
					var comp=ViewModel.findObservable(context, arr[2]);
					var fn=function(){
						$(elem).css(arr[1],comp());
					}
					fn();
					comp.subscribe(fn);
				}
			},
			css: function (elem,value,context){
				value=value.match(/^{([\s\S]+)}$/)[1];
				//console.log(context);
				var attrs=value.split(/\s*,\s*/);
				for(var i=attrs.length-1;i>=0;i--)
				{
					var arr=attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
					var comp=ViewModel.findObservable(context, arr[2]);
					var fn=function(){
						if(comp())
						{
							$(elem).addClass(arr[1]);
						}
						else
						{
							$(elem).removeClass(arr[1]);
						}
					}
					fn();
					comp.subscribe(fn);
				}
			}
		};
	})();
})(undefined);