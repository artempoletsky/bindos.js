(function(){
	var $=this.$;
	var refreshAttr=function(vm,attr,element,fn){
		vm[fn].call(vm,element,attr);
	}
	var eventSplitter=/\s+/;
	var bindSplitter=/\s*;\s*/;
	var simpleTagRegex=/^[a-z]+$/;
	
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
		var $el,binds,bind,me=this,i,context=me;
		me.$el.find('[data-bind]').add(me.$el).filter('[data-bind]').each(function(){
			$el=$(this);
			binds=$el.attr('data-bind').split(bindSplitter);
			for(i=binds.length-1;i>=0;i--){
				var arr=binds[i].match(/^(\S+)\s*:\s*(\S[\s\S]*)$/)
				
				
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
		if(!this._cid)
		{
			this._cid=VM.unique('vm');
		}
		
		if(!this.el)
			this.el='div';
		if(typeof this.el == 'string')
		{
			if(simpleTagRegex.test(this.el))
				this.el=document.createElement(this.el);
			else
				this.el=$(this.el)[0];
		}
		this.$el=$(this.el);
		this.initialize();
		if(this.autoinit)
			this.parse().delegateEvents();
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

