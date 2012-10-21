$(function(){
	ViewModel.binds.click=function(elem, value, context)
	{
		$(elem).click(function(){
			context[value].apply(context, arguments);
		})
	}
	
	ViewModel.create({
		el: '#vm',
		curTab: Observable(0),
		onClick: function(e)
		{
			this.curTab($(e.currentTarget).data('id'));
			e.preventDefault();
		}
	})
});