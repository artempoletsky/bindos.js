describe('Stub', function(){
	
	it('must contains all props in lib',function(){
		for (var className in FrontboneStub)
		{
			var StubClass=FrontboneStub[className];
			var Class=window[className];
			expect(Class).toBeDefined();
			
			for (var proper in Class)
			{
				if(StubClass[proper]===undefined)
				{
					throw Error('Stub '+className+'.'+proper+' not found');
				}
				
				expect(StubClass[proper]).toBeDefined();
				if(typeof StubClass[proper] == 'function')
				{
					if(StubClass[proper].length!==Class[proper].length)
					{
						throw Error('Stub method '+className+'.'+proper+' must have '+Class[proper].length+' arguments');
					}
				}
			}
			for (var proper in Class.prototype)
			{
				if(StubClass.prototype[proper]===undefined)
				{
					throw Error('Stub '+className+'.prototype.'+proper+' not found');
				}
				expect(StubClass.prototype[proper]).toBeDefined();
				if(typeof StubClass.prototype[proper] == 'function')
				{
					if(StubClass.prototype[proper].length!==Class.prototype[proper].length)
					{
						throw Error('Stub method '+className+'.prototype.'+proper+' must have '+Class.prototype[proper].length+' arguments');
					}
				}
			}
			
		}
	})
	
	it('must not contains props not existing in lib',function(){
		for (var className in FrontboneStub)
		{
			var StubClass=FrontboneStub[className];
			var Class=window[className];
			
			for (var proper in StubClass)
			{
				if(Class[proper]===undefined)
				{
					throw Error('Method '+className+'.'+proper+' not found');
				}
				
			}
			for (var proper in StubClass.prototype)
			{
				if(Class.prototype[proper]===undefined)
				{
					throw Error('Method '+className+'.prototype.'+proper+' not found');
				}
				
			}
			
		}
	})
	
	it('each method must return this', function(){
		
		for (var className in FrontboneStub)
		{
			var StubClass=FrontboneStub[className];
			var Class=window[className];
			expect(Class).toBeDefined();
			
			var vm=new StubClass();
			
			var exclude=[
				'Events.hasListener',
				'ViewModel.hasListener',
				'Model.hasListener',
				'Model.parse',
				'Model.get',
				'Model.validate',
				'Collection.parse',
				'Collection.cut',
				'Collection.cutByCid',
				'Collection.cutAt',
				'Collection.at',
				'Collection.get',
				'Collection.hasListener',
				'Collection.getByCid',
				
			]
			var me;
			for(var prop in vm)
			{
				if(typeof vm[prop] == 'function'&&!~exclude.indexOf(className+'.'+prop))
				{
					try {
						me=vm[prop].call(vm);
					} catch (exception) { 
						throw Error(prop+' throw error '+ exception.message);
						break;
					}
					if(me!==vm)
						throw Error(className+'.'+prop+'() not return this');
				}
			}
			/*
			me=vm.on('click', function(){});
			expect(me).toBe(vm);
			me=vm.one('click', function(){});
			expect(me).toBe(vm);
			me=vm.setElement(document.createElement('div'));
			expect(me).toBe(vm);
			*/
		}
		
	})
})