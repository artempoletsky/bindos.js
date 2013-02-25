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
				setter.call(context,arguments[0]);
			}
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
