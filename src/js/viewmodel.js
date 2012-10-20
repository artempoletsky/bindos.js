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
		if(Observable.isObservable(context))
			console.log(context());
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

