(function(){
	
	var Collection=Model.extend({
		
		constructor: function(models,attributes)
		{
			
			this._super(attributes);
			this.models=[];
			this.length=0;
			
			if(models&&models.length)
			{
				this.reset(models);
			}
			this.initialize();
			
		},
		models: [],
		model: Model,
		url: function(){
			return this.baseURL+this.model.prototype.mapping+'/';
		},
		fetch: function(options){
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
			var resOpt=_.extend({},options,opt);
			Model.sync('GET', this.url(), resOpt);
		},
		reset: function(json,options){
			options||(options={});
			if(!options.add)
				this.models=[];
			var modelsArr=this.parse(json);
			
			if(modelsArr instanceof Array)
			{
				for(var i=0,l=modelsArr.length;i<l;i++)
				{
					this.add(modelsArr[i],'end',true);
				}
				if(options.add)
					this.fire('add',modelsArr,0);
				else
					this.fire('reset');
			}
			else
			{
				this.add(modelsArr,'end',true);
				if(options.add)
					this.fire('add',[modelsArr],0);
				else
					this.fire('reset');
			}
		},
		add: function(model,index,silent){
			typeof index=='number'||(index=this.length);
			if(!(model instanceof Model))
			{
				model=Model.createOrUpdate(this.model, model);
			}
			var me=this;
			model.one('remove',function(){
				me.cutByCid(this.cid);
			})
			this.models.splice(index, 0, model);
			this.length=this.models.length;
			if(!silent)
				this.fire('add',[model],index);
		},
		each: function(callback){
			var isBreak;
			for(var i=0,l=this.models.length;i<l;i++)
			{
				isBreak=callback.call(this,this.models[i],i);
				if(isBreak===false)
					break;
			}
			return this;
		},
		cut: function(id){
			var found;
			this.each(function(model,index){
				if(model.id==id)
				{
					found=this.cutAt(index);
					return false;
				}
			})
			return found;
		},
		cutByCid: function(cid){
			var found;
			this.each(function(model,index){
				if(model.cid==cid)
				{
					found=this.cutAt(index);
					return false;
				}
			})
			return found;
		},
		cutAt: function(index){
			var model=this.models.splice(index, 1)[0];
			this.fire('cut',model,index);
			return model;
		},
		at: function(index){
			return this.models[index];
		},
		/**
		 * DEPRECATED since 26.01.2013
		 */
		get: function(){
			return this.getByID.apply(this, arguments);
		},
		getByID: function(id){
			var found;
			this.each(function(model){
				if(model.id==id)
				{
					found=model;
					return false;
				}
			})
			return found;
		},
		getByCid: function(cid){
			var found;
			this.each(function(model){
				if(model.cid==cid)
				{
					found=model;
					return false;
				}
			})
			return found;
		}
	});
	this.Collection=Collection;
})();