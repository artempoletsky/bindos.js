
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
		_.extend(Constructor.prototype,props);
		/*
		_.each(props,function(val,key){
			Constructor.prototype[key]= (
				//если функция и не конструктор
				typeof val =='function' &&
				//и не конструктор
				//конструкторы передаются в чистом виде, иначе ими нельзя создать объект
				typeof val.prototype._constructor == 'undefined' &&
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