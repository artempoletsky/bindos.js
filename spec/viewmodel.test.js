describe('ViewModel', function(){

	it('can create VM object', function(){
		var init=jasmine.createSpy('init');
		var click=jasmine.createSpy('click');
		var obj={
			el: 'div',
			initialize: function(){
				expect(this).toBe(vm);
			},
			events: {
				'click': 'onClick'
			},
			onClick: click
		}
		spyOn(obj, 'initialize')
		var vm=ViewModel.create(obj);
		expect(obj.initialize).toHaveBeenCalled();
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
	it('can undelegate events', function(){
		var called=0;
		var dom=$('<div id="grand"><div class="father"><div class="child"></div></div></div>');
		var vm=ViewModel.create({
			el: dom,
			events: {
				'click .child': 'onClick'
			},
			onClick: function(){
				called++;
			}
		});
		var $child=vm.$el.find('.child');
		$child.click();
		expect(called).toBe(1);
		vm.undelegateEvents();
		$child.click();
		expect(called).toBe(1);
		vm.delegateEvents();
		$child.click();
		expect(called).toBe(2);
	})
	
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
			var fn=function(){
				
				var elems=context[value]();
				var html='';
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
			context[value].subscribe(fn);
			
		}
	}
	
	it('can parse binds from html', function(){
		
		ViewModel.create({
			el: '#testvm',
			events: {
				'change select': 'onChoose',
				'click button': 'reset'
			},
			initialize: function(){
				console.log(this);
				this.chosen=Computable(function(){
					var val=this.chosenId()*1;
					return val?this.variants()[val]:0;
				},this);
			},
			variants: Observable({
				0: 'Choose some value...',
				1: 'Cat',
				2: 'Dog',
				3: 'Bird'
			}),
			chosenId: Observable(0),
			reset: function(){
				this.chosenId(0);
			},
			onChoose: function(e){
				this.chosenId($(e.currentTarget).val());
			}
		});
		
	})
	
	it('each method must return this', function(){
		var vm=new ViewModel();
		var exclude='on,initialize,hasListener,get,set';
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