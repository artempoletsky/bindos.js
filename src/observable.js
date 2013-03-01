(function(){
	var refreshFn;
	(function() {
		
		var requestAnimFallback=(function(){
			/*var calls=[];
			setInterval(function(){
				for(var i=0,l=calls.length;i<l;i++)
				{
					calls[i]();
				}
				calls=[];
			},1000/60);*/
			//fallback - простой синхронный вызов
			return function(callback){
				callback();
			};
		});
		//if(window.mozRequestAnimationFrame)
		//	console.log('refreshFn is requestAnimationFrame');
		refreshFn=window.requestAnimationFrame
		||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.msRequestAnimationFrame||window.oRequestAnimationFrame
		||requestAnimFallback();
		//refreshFn=requestAnimFallback()
	//window.requestAnimationFrame = requestAnimFallback;
	})();
	
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
				fn._listeners[i][0].call(fn._listeners[i][1]||fn);
		}
		fn.callAndSubscribe=function(callback){
			callback.call(this);
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
		var fn,context,async,setter
		if(typeof options=='function')
		{
			fn=options;
			context=arguments[1];
			async=arguments[2];
			setter=arguments[3];
		}
		else
		{
			fn=options.get;
			context=options.context;
			async=options.async;
			setter=options.set;
		}
			
		var value=fn.call(context);
		
		var resfn=function(){
			if(arguments.length==1)
			{
				if(!setter)
					throw new Error('Setter for computed is not defined');
				setter.call(context,arguments[0]);
			}
			if(computedInit)
			{
				computedInit.subscribeTo(resfn);
			}
			return value;
		}
		var _refreshAndFire=function(){
			waitForUpdate=false;
						
			var oldValue=value;
			resfn.refresh();
			//console.log(value,oldValue);
			if(value!==oldValue||_.isObject(value))
			{
				resfn.fire();
			}
		}
		var refreshAndFire=function(){
			
			
			if(resfn.async)
			{
				if(!waitForUpdate)
				{
					waitForUpdate=true;
					refreshFn(_refreshAndFire);
				//window.requestAnimationFrame(_refreshAndFire);
				}
			}
			else
			{
				_refreshAndFire();
			}
		}
		var waitForUpdate=false;
		resfn.async=async||false;
		var observers=[];
		resfn.subscribeTo=function(obs)
		{
			if(!~observers.indexOf(obs))
			{
				observers.push(obs);
				obs.subscribe(refreshAndFire);
			}
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
		delete observers;
		computedInit=false;
		return resfn;
	}
	
	
	
	this.Observable=Observable;
	this.Computed=Computed;
	this.Subscribeable=Subscribeable;
})();
