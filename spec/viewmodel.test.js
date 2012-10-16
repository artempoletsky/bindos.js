describe('ViewModel', function(){

	it('can create VM object', function(){
		var init=jasmine.createSpy('init');
		var click=jasmine.createSpy('click');
		ViewModel.create({
			el: 'div',
			initialize: init,
			events: {
				'click': 'onClick'
			},
			onClick: click
		});
		expect(init).toHaveBeenCalled();
		expect(click).not.toHaveBeenCalled();
		
	})
	
	it('can create VM object with constructor', function(){
		var init=jasmine.createSpy('init');
		var click=jasmine.createSpy('click');
		function TestViewModel(){
			this.el='em';
			this.initialize=init;
			this.events={
				'click': 'onClick'
			};
			this.onClick= click;
			ViewModel.call(this);
		}
		TestViewModel.prototype=new ViewModel();
		var vm=new TestViewModel();
		expect(vm.events.click).toEqual('onClick');
		expect(init).toHaveBeenCalled();
		expect(click).not.toHaveBeenCalled();
		vm.$el.click();
		expect(click).toHaveBeenCalled();
	})
	
	it('each method must return this', function(){
		var vm=new ViewModel();
		var exclude='on,initialize,hasListener';
		var me;
		for(var prop in vm)
		{
			if(typeof vm[prop] == 'function'&&!~exclude.indexOf(prop))
			{
				try {
					me=vm[prop].call(vm);
				} catch (exception) { 
					throw Error(prop+' throw error '+ exception.message);
					break;
				}
				if(me!==vm)
					throw Error(prop+'() not return this');
			}
		}
		me=vm.on('click', function(){});
		expect(me).toBe(vm);
	})
	
	
	
	
})