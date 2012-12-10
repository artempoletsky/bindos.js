(function(){
	var ctor=function(){};
	var AbstractClass=function(){
		
	}
	
	AbstractClass.extend=function(props){
		var Constructor=(props&& props.hasOwnProperty('constructor'))?
		props.constructor :
		function(){
			ParentClass.apply(this, arguments);
		};
			
		ctor.prototype=ParentClass.prototype;
		Constructor.prototype=new ctor();
			
		$.extend(Constructor.prototype, props);
		Constructor.prototype.constructor=Constructor;
		Constructor.extend = ParentClass.extend;
		return Constructor;
		
	};
	this.AbstractClass=AbstractClass;
})()