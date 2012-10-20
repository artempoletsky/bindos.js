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
			//console.log(comp);
			//console.log(comp()());
			return comp();
		}
	};
})();



$(function(){
	
	var vm={
		foo: Observable({
			bar:{ 
				baz: 'bar content'
			}
		}),
		bar: Observable('435dffgd')
	}
	ViewModel.findBinds($('#with')[0], vm);
	vm.foo({
		bar:{ 
			baz: 'bar content 2'
		}
	});
	return;
	var comp=ViewModel.findObservable(vm, 'foo().bar.baz+bar()');
	var comp2=ViewModel.findObservable(vm.foo, 'bar.baz');
	console.log(comp());
	vm.bar(234234);
	console.log(comp());
	
	console.log(comp2());
	vm.foo({
		bar: {
			baz: 1324
		}
	})
	console.log(comp2());
	return;
	/*
	
	ViewModel.binds.html($('#with span')[0], vm.bar, '+15');
	vm.bar({});
	alert(vm.bar+15)
	return;*/
	ViewModel.create({
		el: '#with',
		foo: Observable({
			bar: 'bar content'
		}),
		bar: Observable('435dffgd'),
		events: {
			'click': 'click'
		},
		numClicks:0,
		click: function(){
			this.numClicks++;
			this.foo({
				bar:'I click it '+ this.numClicks +' times'
			});
		}
	})
	return;
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
		models: Observable(),
		initialize: function(){
			var me=this;
			carsCollection.on('reset remove add', function(){
				me.models(this.models);
			});
		},
		events: {
			'click #insertOne': 'insert'
		},
		insert:function(){
			
		}
	})
});