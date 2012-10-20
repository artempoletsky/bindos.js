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
})()

if(false)
{
	/****************************/
	/***********EXAMPLE**********/
	/****************************/
	var a=Observable('Hello');
	var b=Observable(' World');
	var cvar=Computable(function(){
		return a()+b();
	});
	cvar.name='cvar';
	console.log('cvar is '+cvar());
	
	cvar.subscribe(function(){
		console.log('cvar changed to '+this());
	});
	
	b(' Youmu');
	
	var dvar=Computable(function(){
		return cvar()+' and Youmu';
	});
	dvar.name='dvar';
	dvar.subscribe(function(){
		console.log('dvar changed to '+this());
	});
	
	
	b(' World');
}