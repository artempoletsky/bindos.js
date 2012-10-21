


$(function(){

	var Car=Model.extend({
		mapping: 'cars'
	});
	
	var carsCollection=new(Collection.extend({
		model: Car
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