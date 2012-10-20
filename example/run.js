(function(){
	ViewModel.binds={
		html: function(elem,value,context){
			var fn=function(){
				$(elem).html(context[value]());
			}
			fn();
			context[value].subscribe(fn);
		},
		display: function(elem,value,context){
			var fn=function(){
				(context[value]())?$(elem).show():$(elem).hide();
			}
			fn();
			context[value].subscribe(fn);
		},
		enabled: function(elem,value,context){
			//console.log(context[value],context);
			var fn=function(){
				(context[value]())?$(elem).prop('disabled', false):$(elem).prop('disabled', true);
			}
			fn();
			context[value].subscribe(fn);
		},
		disabled: function(elem,value,context){
			var fn=function(){
				(!context[value]())?$(elem).prop('disabled', false):$(elem).prop('disabled', true);
			}
			fn();
			context[value].subscribe(fn);
		},
		value: function(elem,value,context){
			var fn=function(){
				$(elem).val(context[value]());
			}
			fn();
			context[value].subscribe(fn);
		},
		click: function(elem,value,context){
			$(elem).on('click',function(){
				context[value].apply(context,arguments);
			});	
		},
		show_hide: function(elem,value,context){
			value=value.split(/\s+/);
			var val=value[1];
			var duration=value[0];
			
			var fn=function(){
				(context[val]())?$(elem).show(duration):$(elem).hide(duration);
			}
			fn();
			context[val].subscribe(fn);
			
		},
		select: function(elem,value,context){
			value=value.replace("'",'"','g');
			//console.log(value);
			//console.log(value);
			value=$.parseJSON(value);
			var placeholder=value.placeholder||false;
			var placeholderVal=value.placeholderVal||0;
			
			//console.log(value);
			var fn=function(){
				var elems=context[value.options]();
				var html='';
				if(placeholder)
					html+='<option value="'+placeholderVal+'">'+placeholder+'</option>'
				for(var prop in elems)
				{
					if(elems.hasOwnProperty(prop))
					{
						html+='<option value="'+prop+'">'+elems[prop]+'</option>'
					}
				}
				$(elem).html(html);
			}
			fn();
			context[value.options].subscribe(fn);
			
		},
		each: function(elem,value,context){
			console.log(elem,value,context);
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