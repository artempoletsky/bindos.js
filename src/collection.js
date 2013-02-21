(function(){
	var itself=function(self){
		this.self=self;
	}
	var Collection=Model.extend({
		
		constructor: function(models,attributes)
		{
			this.itself=new itself(this);
			this.models=[];
			this.length=0;
			
			if(models&&models.length)
			{
				this.reset(models);
			}
			this.initialize(attributes);
			
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
			{
				this.models=[];
				this.length=0;
			}
			if(!json)
			{
				this.fire('reset');
				return;
			}
				
				
			var modelsArr=this.parse(json);
			
			this.add(modelsArr,'end',!options.add);
			if(!options.add)
				this.fire('reset');			
			
		},
		push: function(model){
			return this.add(model);
		},
		unshift: function(model){
			return this.add(model,0);
		},
		add: function(models,index,silent){
			if(!(models instanceof Array))
				models=[models];
			typeof index=='number'||(index=this.length);
			var me=this;
			var addedModels=[];
			_.each(models,function(model,ind){
				if(!(model instanceof Model))
				{
					model=Model.createOrUpdate(me.model, model);
				}
				addedModels.push(model);
				
				model.one('remove',function(){
					me.cutByCid(this.cid);
				});
				
				me.models.splice(index+ind, 0, model);
				
			});
		
			this.length=this.models.length;
			if(!silent)
				this.fire('add',addedModels,index);
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
			var self=this;
			this.each(function(model,index){
				if(model.cid==cid)
				{
					found=self.cutAt(index);
					return false;
				}
			})
			return found;
		},
		shift: function(){
			return this.cutAt(0);
		},
		pop: function(){
			return this.cutAt();
		},
		cutAt: function(index){
			index!==undefined||(index=this.models.length-1);
			var model=this.models.splice(index, 1)[0];
			this.length=this.models.length;
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
	
	// Underscore methods that we want to implement on the Collection.
	var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
	'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
	'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortByDesc', 'sortedIndex',
	'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
	'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];
	
	// An internal function to generate lookup iterators.
	var lookupIterator = function(value) {
		return _.isFunction(value) ? value : function(obj){
			return obj[value];
		};
	};

	// Sort the object's values by a criterion produced by an iterator.
	_.sortByDesc = function(obj, value, context) {
		var iterator = lookupIterator(value);
		return _.pluck(_.map(obj, function(value, index, list) {
			return {
				value : value,
				index : index,
				criteria : iterator.call(context, value, index, list)
			};
		}).sort(function(left, right) {
			var a = left.criteria;
			var b = right.criteria;
			if (a !== b) {
				if (a > b || a === void 0) return -1;
				if (a < b || b === void 0) return 1;
			}
			return left.index < right.index ? -1 : 1;
		}), 'value');
	};
	
	// Mix in each Underscore method as a proxy to `Collection#models`.
	_.each(methods, function(method) {
		Collection.prototype[method] = function() {
			return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
		};
	});
	
	var filterMethods = ['filter', 'reject'];
	var sortMethods = ['sortBy','sortByDesc','shuffle'];

	_.each(filterMethods, function(method) {
		itself.prototype[method] = function() {
			var antonym=method=='filter'?'reject':'filter';
			var self=this.self;
			var newModels=_[method].apply(_, [self.models].concat(_.toArray(arguments)));
			var rejectedModels=_[antonym].apply(_, [self.models].concat(_.toArray(arguments)));
			var indexes={};
			_.each(rejectedModels,function(model){
				indexes[self.indexOf(model)]=model;
			});
			self.models=newModels;
			self.length=newModels.length;
			//console.log(indexes);
			self.fire('reject', indexes);
			return self;
		};
	});
	
	_.each(sortMethods, function(method) {
		itself.prototype[method] = function() {
			var self=this.self;
			var newModels=_[method].apply(_, [self.models].concat(_.toArray(arguments)));
			var indexes={};
			_.each(newModels,function(model,index){
				indexes[self.indexOf(model)]=index;
			});
			self.models=newModels;
			self.length=newModels.length;
			//console.log(indexes);
			self.fire('sort', indexes);
			return self;
		};
	});
	
	this.Collection=Collection;
})();