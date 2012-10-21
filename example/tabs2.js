$(function(){
	var tabsObservables={};
	ViewModel.binds.tabsHead=function(elem, value, context)
	{
		var obs=tabsObservables[value]||(tabsObservables[value]=Observable(0));
		$(elem).on('click','a',function(){
			var index=$(this).index();
			tabsObservables[value](index);
		});
		obs.subscribe(function(){
			var $children=$(elem).children('a');
			$children.eq(this.lastValue).removeClass('cur');
			$children.eq(this()).addClass('cur');			
		});
		obs.fire();
	}
	ViewModel.binds.tabsBody=function(elem, value, context)
	{
		var obs=tabsObservables[value]||(tabsObservables[value]=Observable(0));
		$(elem).children().hide();
		obs.subscribe(function(){
			var $children=$(elem).children();
			$children.eq(this.lastValue).slideUp();
			$children.eq(this()).slideDown();			
		});
		obs.fire();
	}
	
	ViewModel.create({
		el: '#vm'
	})
});