(function(){
	var Class=function(){
		
	}
	var basePath='src/js/';
	var checkClass=function(module){
		try {
			var result=eval(module);
			if(typeof result!==undefined)
			{
				return result;
			}
		} catch (exception) { 
		}
		return false;
	}
	Class.extendsFrom=function(module)
	{
		var className=module.split('.').pop();
		var parent=checkClass(module);
		if(!parent)
		{
			var path=basePath+module.toLowerCase().replace('.', '/','g')+'.js';
			try {
				require(path);
			} catch (exception) { 
				throw exception;
			}
			parent=checkClass(module);
			if(!parent)
				throw new Error('Class '+className+' not exists!');
		}
		
		//console.log(parent);
	}
	//Class.extendsFrom('Foo');
	window.Class=Class;
})()