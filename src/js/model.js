(function(){
	var Model=function(){
		console.log(this.constructor.name);
	}
	Model.prototype=new Events();
	
})()