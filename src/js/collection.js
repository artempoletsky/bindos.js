(function(){
	function Collection(json,options){
		options||(options={});
		json||(json={});
		this.models=this.parse(json);
		this.model=options.model||Model;
		this.idAttribute=options.idAttribute||'id';
		this.id=this.attributes[this.idAttribute];
		if(this.mapping&&this.id)
		{
			modelsMap[this.mapping]||(modelsMap[this.mapping]={});
			modelsMap[this.mapping][this.id]=this;
		}
		this.initialize();
	}
	
})()