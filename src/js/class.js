
(function(){
	var ctor=function(){};
	var Class=function(){
		
	}
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
		_.each(props,function(val,key){
			
			//если функция и не конструктор
			//конструкторы передаются в чистом виде, иначе ими нельзя создать объект
			if(typeof val =='function'&&typeof val.prototype._constructor == 'undefined')
			{
				Constructor.prototype[key]=
				(function(key,func){
					return function(){
						var oldSuper=this._super;
						this._super=ParentClass.prototype[key];
						var result=func.apply(this, arguments);
						this._super=oldSuper;
						return result;
					};
				})(key,val);
			}
			else
			{
				Constructor.prototype[key]=val;
			}
		});
		
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