(function(){
	var modelsMap={};
	function Model(json,options){
		options||(options={});
		this.attributes=this.parse(json);
		this.mapping=options.mapping||false;
		this.idAttribute=options.idAttribute||'id';
		this.id=this.attributes[this.idAttribute];
		if(this.mapping&&this.id)
		{
			modelsMap[this.mapping]||(modelsMap[this.mapping]={});
			modelsMap[this.mapping][this.id]=this;
		}
		this.initialize();
	}
	Model.prototype=new Events();
	Model.prototype.initialize=function(){
		return this;
	}
	Model.prototype.parse=function(json){
		return json;
	}
	Model.prototype.update=function(json){
		this.set(this.parse(json));
	}
	Model.prototype.get=function(name){
		return this.attributes[name];
	}
	Model.prototype.set=function(name,value){
		var attrs={},prop;
		if(arguments.length>1)
			attrs[name]=value;
		else
			attrs=name;
		for(prop in attrs)
		{
			this.attributes[prop]=attrs[prop];
			this.fire('change:'+prop);
		}
		this.fire('change');
		return this;
	}
	Model.fromStorage=function(name,id){
		modelsMap[name]||(modelsMap[name]={});
		return modelsMap[name][id];
	}
	this.Model=Model;
})()