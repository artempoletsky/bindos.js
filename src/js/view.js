(function(){
	
	
	function View(options) {
		this.model=options.model;
		this.collection=options.collection;
		this.options=options;
		
	}
	
	View.prototype.delegateEvents=function(events){
			
	}
	
	View.prototype.render=function(){};
})();
var BodyView=function(){
	this.events={
		'click': 'fasf',
	}
	View.call(this);
}
BodyView.prototype=new View();

var bv=new BodyView();

bv.delegateEvents(events);

