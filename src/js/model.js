(function(){
	var modelsMap={};
	function Model(json,options){
		json||(json={});
		options||(options={});
		this.attributes=this.parse(json);
		this.id=this.attributes[this.idAttribute];
		this.cid=VM.unique('c');
		
		if(this.mapping&&this.id)
		{
			modelsMap[this.mapping]||(modelsMap[this.mapping]={});
			modelsMap[this.mapping][this.id]=this;
		}
		this.url='api/?model='+this.mapping+'&id='+this.id;
		this.initialize();
	}
	Model.extend=function(props){
		var ParentClass=this.prototype.constructor;
		var Constructor=function(json,options){
			ParentClass.call(this,json,options)
		}
		Constructor.prototype=new ParentClass();
		Constructor.prototype.constructor=Constructor;
		for(var prop in props)
		{
			Constructor.prototype[prop]=props[prop];
		}
		Constructor.extend=ParentClass.extend;
		return Constructor;
	}
	Model.prototype=new Events();
	Model.prototype.constructor=Model;
	Model.prototype.idAttribute='id';
	Model.prototype.mapping=false;
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
	Model.prototype.validate=function(){
		return true;
	}
	Model.prototype.save=function(){
		var me=this;
		if(this.id)
			VM.sync('PUT', this.url,{
				data: this.attributes
			});
		else
			VM.sync('POST', this.url,{
				data: this.attributes,
				success: function(data){
					me.set('id',data);
					me.id=data;
				}
			});
		return true;
	}
	Model.prototype.remove=function(){
		this.fire('remove');
		if(this.id)
			VM.sync('DELETE', this.url);
	}
	Model.prototype.set=function(name,value){
		var attrs={},prop;
		if(arguments.length>1)
			attrs[name]=value;
		else
			attrs=name;
		var changed={};
		for(prop in attrs)
		{
			this.attributes[prop]=attrs[prop];
			changed[prop]=attrs[prop];
			this.fire('change:'+prop);
		}
		this.fire({
			type: 'change',
			changed:changed
		});
		return this;
	}
	Model.fromStorage=function(name,id){
		modelsMap[name]||(modelsMap[name]={});
		return modelsMap[name][id];
	}
	Model.createOrUpdate=function(constuctor,json){
		var proto=constuctor.prototype,fromStorage,idAttr,parsed,id;
		if(proto.mapping)
		{
			idAttr=proto.idAttribute;
			parsed=proto.parse(json);
			fromStorage=Model.fromStorage(proto.mapping, parsed[idAttr]);
			if(fromStorage)
			{
				fromStorage.update(json);
				return fromStorage;
			}
		}
		return new constuctor(json);
	}
	this.Model=Model;
})()