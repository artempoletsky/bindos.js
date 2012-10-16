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
	
	it('context of \'delegateEvents\' handlers must be this ViewModel', function(){
		var called=false;
		var vm=ViewModel.create({
			events: {
				'click': 'onClick'
			},
			onClick: function(){
				called=true;
				expect(this).toBe(vm);
			}
		});
		expect(vm.events.click).toEqual('onClick');
		expect(called).toBe(false);
		vm.$el.click();
		expect(called).toBe(true);
	})
	
	it('can delegate events', function(){
		var called=false;
		var dom=$('<div id="grand"><div class="father"><div class="child"></div></div></div>');
		var vm=ViewModel.create({
			el: dom,
			events: {
				'click .child': 'onClick'
			},
			onClick: function(e){
				called=true;
				expect(this).toBe(vm);
				expect(e.currentTarget).toBe(dom.find('.child')[0]);
			}
		});
		expect(called).toBe(false);
		vm.$el.click();
		expect(called).toBe(false);
		vm.$el.find('.child').click();
		expect(called).toBe(true);
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