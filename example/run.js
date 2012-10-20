(function(){
	ViewModel.binds={
		html: function(elem,value,context){
			var comp=ViewModel.findObservable(context, value);
			var fn=function(){
				$(elem).html(comp());
			}
			fn();
			comp.subscribe(fn);
		},
		'with': function (elem,value,context){
			var comp=ViewModel.findObservable(context, value);
			return comp();
		},
		each: function (elem,value,context){
			var comp=ViewModel.findObservable(context, value)();
			//console.log(value,context,context.models());
			//console.log(comp()());
			var html=$(elem).html();
			$(elem).empty();
			var fn=function(){
				var collection=comp();
				if(collection)
					collection.each(function(model,index){
						var tempDiv=document.createElement('div');
						$(tempDiv).html(html);
						ViewModel.findBinds(tempDiv, model);
						$(tempDiv).children().appendTo(elem);
					})
			}
			fn();
			comp.subscribe(fn);
			return false;
		},
		value: function (elem,value,context){
			var comp=ViewModel.findObservable(context, value);
			var fn=function(){
				$(elem).val(comp());
			}
			fn();
			comp.subscribe(fn);
		},
		attr: function (elem,value,context){
			console.log(value);
			return;
			var comp=ViewModel.findObservable(context, value);
			var fn=function(){
				$(elem).val(comp());
			}
			fn();
			comp.subscribe(fn);
		}
	};
})();



$(function(){

	var Car=Model.extend({
		mapping: 'cars'
	});
	var car=new Car();
	
	var carsCollection=new(Collection.extend({
		model: Car,
	}));
	
	carsCollection.fetch();
	ViewModel.create({
		el: '#vm',
		collection: Observable(),
		initialize: function(){
			var me=this;
			carsCollection.on('reset', function(){
				me.collection(this);
			});
		},
		events: {
			'click #insertOne': 'insert'
		},
		insert:function(){
			
		}
	})
});