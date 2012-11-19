var FrontboneStub;
(function(window){
	var Events=window.Events=function(){
		
	}
	Events.prototype.on=function(events,callback,context){
		return this;
	}
	Events.prototype.off=function(events,callback,context){
		return this;
	}
	Events.prototype.fire=function(events){
		return this;
	}
	Events.prototype.one=function(events,callback,context){
		return this;
	}
	Events.prototype.hasListener=function(events){
		return true;
	}
	
	var Model=window.Model=function(json,options){
		Events.call(this);
		return this;
	}
	Model.extend=function(proto){
		return Model;
	}
	Model.fromStorage=function(mapping,id){
		return new Model();
	}
	Model.createOrUpdate=function(constuctor,json){
		return new Model();
	}
	 
	Model.prototype=new Events();
	Model.prototype.constructor=Model;
	Model.prototype.idAttribute='id';
	Model.prototype.mapping='modelName';
	Model.prototype.initialize=function(){
		return this;
	}
	Model.prototype.parse=function(rawServerData){
		return new Object();
	}
	Model.prototype.update=function(rawServerData){
		return this;
	}
	Model.prototype.get=function(prop){
		return new Object();
	}
	Model.prototype.set=function(prop,value){
		return this;
	}
	Model.prototype.validate=function(){
		return true;
	}
	Model.prototype.save=function(){
		return this;
	}
	Model.prototype.remove=function(){
		return this;
	}

	var ViewModel=window.ViewModel=function(){
		Events.call(this);
		return this;
	}
	ViewModel.prototype=new Events();
	ViewModel.prototype.constructor=ViewModel;
	
	ViewModel.findObservable=function(context,string){
		
	}
	ViewModel.findBinds=function(htmlElement,context){
		
	}
	ViewModel.create=function(object){
		
	}
	ViewModel.binds={
		
	}
	
	ViewModel.prototype.setElement=function(htmlElement){
		return this;
	}
	ViewModel.prototype.parse=function(){
		return this;
	}
	ViewModel.prototype._construct=function(){
		return this;
	}
	ViewModel.prototype.autoinit=true;
	ViewModel.prototype.initialize=function(){
		return this;
	}
	ViewModel.prototype.delegateEvents=function(eventsObject){
		return this;
	}
	ViewModel.prototype.undelegateEvents=function(){
		return this;
	}
	ViewModel.prototype.render=function(){
		return this;
	}
	var Subscribeable=window.Subscribeable=function(){
		
	}
	Subscribeable.prototype={};
	var Observable=window.Observable=function(){
		
	}
	Observable.prototype={};
	Observable.isObservable=function(functionToTest){
		
	}
	var Computed=window.Computed=function(){
		
	}
	Computed.prototype={};
	
	var Collection=window.Collection=function(json){
		return this;
	}
	Collection.extend=function(proto){
		
	}
	Collection.prototype=new Events();
	Collection.prototype.constructor=Collection;
	Collection.prototype.model=Model;
	Collection.prototype.initialize=function(){
		return this;
	};
	Collection.prototype.fetch=function(options){
		return this;
	};
	Collection.prototype.parse=function(rawServerData){
		return rawServerData;
	};
	Collection.prototype.reset=function(json,options){
		return this;
	};
	Collection.prototype.add=function(modelOrObject){
		return this;
	};
	Collection.prototype.cut=function(modelID){
		return new Model();
	};
	Collection.prototype.cutByCid=function(modelCid){
		return new Model();
	};
	Collection.prototype.cutAt=function(index){
		return new Model();
	};
	Collection.prototype.at=function(index){
		return new Model();
	};
	Collection.prototype.each=function(callback){
		return this;
	};
	Collection.prototype.get=function(modelID){
		return new Model();
	};
	Collection.prototype.getByCid=function(modelID){
		return new Model();
	};
	Collection.prototype.remove=function(modelID){
		return this;
	};
})(FrontboneStub={})