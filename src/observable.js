(function(){
	var waitForRefresh=[];
	var refreshActive=false;
	
	var refreshFn=window.requestAnimationFrame
	||window.webkitRequestAnimationFrame
	||window.mozRequestAnimationFrame
	||window.msRequestAnimationFrame
	||window.oRequestAnimationFrame
	||function(cb){
		setTimeout(function(){
			cb();
		}, 1000/15);
	};
	
	window.ComputedRefresher={
		refreshAll: function(){
			_.each(waitForRefresh,function(val){
				val.refresh();
			});
			waitForRefresh=[];
		},
		startRefresh:function(){
			var self=this;
			refreshActive=true;
			refreshFn(function(){
				if(refreshActive)
				{
					self.refreshAll();
					self.startRefresh();
				}
			})
		},
		stopRefresh: function(){
			refreshActive=false;
		}
	}
	ComputedRefresher.startRefresh();
	
	var Subscribeable=function(fn){
		fn._listeners=[];
		fn.subscribe=function(callback,context){
			fn._listeners.push(arguments);
		}
		fn.unsubscribe=function(callback){
			for(var i=0,l=fn._listeners.length;i<l;i++)
				if(fn._listeners[i][0]===callback)
					fn._listeners.splice(i, 1);
		}
		fn.fire=function(){
			for(var i=0,l=fn._listeners.length;i<l;i++)
				fn._listeners[i][0].call(fn._listeners[i][1]||fn,fn());
		}
		fn.callAndSubscribe=function(callback){
			callback.call(this,fn());
			this.subscribe(callback)
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
	
	var Computed=function(options){
		var getter,context,async,setter
		if(typeof options=='function')
		{
			getter=options;
			context=arguments[1];
			async=arguments[2];
			setter=arguments[3];
		}
		else
		{
			getter=options.get;
			context=options.context;
			async=options.async;
			setter=options.set;
		}
		
		var resfn=function(){
			if(arguments.length==1)
			{
				if(!setter)
					throw new Error('Setter for computed is not defined');
				setter.call(context,arguments[0]);
			}
			return getter.call(context);
		}
		
		var fireProxy=function(){
			if(async)
				waitForRefresh.push(resfn);
			else
				resfn.refresh();
		}
		
		
		resfn.async=async||false;
		var dependencies=[];
		
		resfn.subscribeTo=function(obs)
		{
			if(!~dependencies.indexOf(obs))
			{
				dependencies.push(obs);
				obs.subscribe(fireProxy)
			}
		}
		
		Subscribeable(resfn);
		
		
		resfn.__observable=true;
		
		resfn.valueOf=resfn.toString=function(){
			return this();
		}
		computedInit=resfn;
		var oldValue=getter.call(context);
		computedInit=false;
		
		resfn.refresh=function(){
			var val=this();
			if(oldValue!==val||_.isObject(val))
			{
				this.fire();
			}
			oldValue=val;
		}
		delete dependencies;
		delete resfn.subscribeTo;
		return resfn;
	}
	
	
	
	this.Observable=Observable;
	this.Computed=Computed;
	this.Subscribeable=Subscribeable;
})();
