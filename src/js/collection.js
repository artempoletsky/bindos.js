(function(){
	function Collection(json){
		this.models=[];
		this.length=0;
		this.url='api/?model='+this.model.prototype.mapping;
		if(json)
		{
			this.reset(json);
		}
		this.initialize();
	}
	
	Collection.prototype=new Events();
	Collection.prototype.constructor=Collection;
	Collection.extend=Model.extend;
	Collection.prototype.model=Model;
	Collection.prototype.initialize=function(){
		return this;
	}
	Collection.prototype.fetch=function(options){
		var me=this;
		options||(options={});
		var opt={
			success: function(data){
				me.reset(data,options);
				if(typeof options.success == 'function')
				{
					options.success.apply(me,arguments);
				}
			},
			error: function(){
				if(typeof options.error == 'function')
				{
					options.error.apply(me,arguments);
				}
			}
		}
		var resOpt={};
		$.extend(resOpt,options,opt);
		VM.sync('GET', this.url, resOpt);
	}
	Collection.prototype.parse=function(json){
		return json;
	}
	Collection.prototype.reset=function(json,options){
		options||(options={});
		if(!options.add)
			this.models=[];
		var modelsArr=this.parse(json);
		if(modelsArr instanceof Array)
		{
			for(var i=0,l=modelsArr.length;i<l;i++)
			{
				this.add(modelsArr[i]);
			}
		}
		else
		{
			this.add(modelsArr);
		}
		if(!options.add)
			this.fire('reset');
		else
			this.fire('addScope');
		
	}
	Collection.prototype.add=function(obj){
		
		if(!(obj instanceof Model))
		{
			obj=Model.createOrUpdate(this.model, obj);
		}
		this.models.push(obj);
		this.fire('add');
	}
	Collection.prototype.cut=function(id){
		var found;
		this.each(function(model,index){
			if(model.id==id)
			{
				found=this.cutAt(index);
				return false;
			}
		})
		return found;
	}
	Collection.prototype.cutAt=function(index){
		return this.models.splice(index, 1);
	}
	Collection.prototype.at=function(index){
		return this.models[index];
	}
	Collection.prototype.each=function(callback){
		var isBreak;
		for(var i=0,l=this.models.length;i<l;i++)
		{
			isBreak=callback.call(this,this.models[i],i);
			if(isBreak===false)
				break;
		}
		return this;
	}
	Collection.prototype.get=function(id){
		var found;
		this.each(function(model){
			if(model.id==id)
			{
				found=model;
				return false;
			}
		})
		return found;
	}
	this.Collection=Collection;
})()