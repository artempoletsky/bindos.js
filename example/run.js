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
			var collection=ViewModel.findObservable(context, value)();
			
			var html=$(elem).html();
			$(elem).empty();
			
			collection.on('add',function(e){
				//console.log(e.model);
				var tempDiv=document.createElement('div');
				$(tempDiv).html(html);
				var obs=Observable(e.model);
				ViewModel.findBinds(tempDiv, obs);
				var $children=$(tempDiv).children();
				$children.appendTo(elem);
				e.model.one('remove',function(){
					$children.remove();
				}).on('change',function(e){
					obs.fire();
				})
			});
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
			value=value.match(/^{([\s\S]+)}$/)[1];
			//console.log(context);
			var attrs=value.split(/\s*,\s*/);
			for(var i=attrs.length-1;i>=0;i--)
			{
				var arr=attrs[i].split(/\s*:\s*/);
				var comp=ViewModel.findObservable(context, arr[1]);
				var fn=function(){
					$(elem).attr(arr[0],comp());
				}
				fn();
				comp.subscribe(fn);
			}
		},
		style: function (elem,value,context){
			value=value.match(/^{([\s\S]+)}$/)[1];
			//console.log(context);
			var attrs=value.split(/\s*,\s*/);
			for(var i=attrs.length-1;i>=0;i--)
			{
				var arr=attrs[i].split(/\s*:\s*/);
				var comp=ViewModel.findObservable(context, arr[1]);
				var fn=function(){
					$(elem).css(arr[0],comp());
				}
				fn();
				comp.subscribe(fn);
			}
		}
	};
})();



$(function(){

	var Car=Model.extend({
		mapping: 'cars'
	});
	
	var carsCollection=new(Collection.extend({
		model: Car,
	}));
	
	carsCollection.fetch();
	ViewModel.create({
		el: '#vm',
		collection: carsCollection,
		initialize: function(){
			
		},
		events: {
			'click #insertOne': 'insert',
			'click .remove': 'remove',
			'click .save': 'save',
			'change input': 'change'
		},
		change: function(e){
			var $t=$(e.currentTarget);
			var model=this.getModel(e);
			model.set($t.attr('name'),$t.val());
		},
		getModel: function(e){
			var tr=$(e.currentTarget).closest('tr');
			var id=tr.attr('id');
			var cid=id.match(/^car(.*)$/)[1];
			e.preventDefault();
			return this.collection.getByCid(cid);
		},
		remove: function(e){
			this.getModel(e).remove();
		},
		save: function(e){
			this.getModel(e).save();
		},
		insert:function(){
			carsCollection.add({
				amount: 0,
				color: 'white'
			})
		}
	})
});