(function(){
	function parseBind(bind){
		
	}
	var eventSplitter=/\s+/;
	ViewModel.create=function(obj){
		$.extend(obj,ViewModel.prototype);
		obj.go();
	}
	function ViewModel() {
		Events.call(this);
		this._binds={};
		this.events={};
		this._cid='';
	}
	ViewModel.prototype=new Events();
	ViewModel.prototype.addBind=function(attr,bind){
		var binds;
		binds=this._binds||(this._binds={});
	}
	ViewModel.prototype.setElement=function(el){
		this.el=el;
		this.$el=$(el);
		this.parse();
	}
	ViewModel.prototype.parse=function(){
		delete this._binds;
	}
	ViewModel.prototype.go=function(){
		if(!this._cid)
		{
			this._cid=VM.unique('vm');
		}
		this.parse();
		this.delegateEvents();
	}
	ViewModel.prototype.delegateEvents=function(events){
		events||(events=this.events);
		
	}
	ViewModel.prototype.undelegateEvents=function(events){
		this.$el.unbind('.'+this._cid);
	}
	
	ViewModel.prototype.render=function(){};
})();

