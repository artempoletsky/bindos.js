describe('ViewModel', function(){

	it('can create VM object', function(){
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
	
	xit('can create VM object with constructor', function(){
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
			el: 'body',
			events: {
				'click': 'onClick'
			},
			onClick: function(){
				console.log(434);
				called=true;
				expect(this).toBe(vm);
			}
		});
		expect(vm.events.click).toEqual('onClick');
		expect(called).toBe(false);
		//$('body').append(vm.$el);
		vm.$el.click();
		expect(called).toBe(true);
	})
	
	xit('can delegate events', function(){
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
	xit('can undelegate events', function(){
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
			value=value.replace(/'/g,'"');
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
			
		}
	}
	
	xit('can parse binds from html', function(){
		
		ViewModel.create({
			el: '#testvm',
			events: {
				'change select': 'onChoose',
				'click #reset': 'reset',
				'click #add': 'addVariant'
			},
			addVariant: function(){
				var variants=this.variants();
				variants.length++;
				var newVal=this.$('input[name=add_new]').val();
				variants[variants.length]=newVal;
				this.variants.fire();
				this.chosenId.fire();
			},
			initialize: function(){
				this.chosen=Computed(function(){
					var val=this.chosenId();
					return val!=-1?this.variants()[val]:0;
				},this);
			},
			variants: Observable([
				'Cat',
				'Dog',
				'Bird'
			]),
			chosenId: Observable(-1),
			reset: function(){
				this.chosenId(-1);
			},
			onChoose: function(e){
				this.chosenId(parseInt($(e.currentTarget).val(),10));
			}
		});
		
	})
	
	xit('each method must return this', function(){
		var vm=new ViewModel();
		var exclude='on,initialize,hasListener,get,$,setElement,one,bindToModel,_constructor';
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
		me=vm.one('click', function(){});
		expect(me).toBe(vm);
		me=vm.setElement(document.createElement('div'));
		expect(me).toBe(vm);
	})
	
	
	
	
})