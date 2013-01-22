describe('Events', function(){
	
	describe('support one single event',function(){
		
		
		it('and should be able to bind event', function(){
			var spyHandler=jasmine.createSpy('handler');
			var spyHandler2=jasmine.createSpy('handler');
		
			var disp=new Events();
			expect(disp.hasListener('foo')).toBeFalsy();
			disp.on('foo', spyHandler);
			disp.on('bar', spyHandler2);
			console.log(disp._listeners);
			expect(disp.hasListener('foo')).not.toBeFalsy();
		})
		xit('and should be able to trigger event', function(){
			disp.fire('foo');
			expect(spyHandler).toHaveBeenCalled();
			
		})
		
		xit('and should be able to trigger multiple handlers', function(){
			
			var context=new Object(),
			event={
				type: 'baz'
			};
			var obj={
				bazHandler:function(e){
					expect(e).toBe(event);
					expect(this).toBe(context);
				},
				bazHandler2:function(e){
					expect(e).toBe(event);
					expect(this).toBe(obj);
				}
			}
			
			spyOn(obj, 'bazHandler');
			spyOn(obj, 'bazHandler2');
			
			disp.on('baz',obj.bazHandler ,context)
			disp.on('baz',obj.bazHandler2)
			disp.fire(event);
			expect(obj.bazHandler.calls.length).toEqual(1);
			expect(obj.bazHandler2.calls.length).toEqual(1);
			
			disp.fire('baz');
			expect(obj.bazHandler.calls.length).toEqual(2);
			expect(obj.bazHandler2.calls.length).toEqual(2);
			
			disp.fire('baz2');
			expect(obj.bazHandler.calls.length).toEqual(2);
			expect(obj.bazHandler2.calls.length).toEqual(2);
		})
		
		xit('and should be able to unbind event', function(){
			//console.log(disp._listeners);
			disp.off('foo',spyHandler);
			//console.log(disp._listeners);
			disp.fire('foo');
			expect(spyHandler.calls.length).toEqual(1);
			disp.fire('bar');
			expect(spyHandler2.calls.length).toEqual(1);
		})
		
		xit('and should be able to unbind all handlers with some context', function(){
			var context1=new Object();
			var spy1=jasmine.createSpy('spy1');
			var spy2=jasmine.createSpy('spy2');
			
			disp.on('foo', spy2).on('foo', spy1, context1);
			disp.fire('foo');
			expect(spy1.calls.length).toEqual(1);
			expect(spy2.calls.length).toEqual(1);
			
			disp.off(null,null,context1);
			
			disp.fire('foo');
			
			expect(spy1.calls.length).toEqual(1);
			expect(spy2.calls.length).toEqual(2);
		})
		
		xit('and should be able to unbind all same handlers', function(){
			var spy1=jasmine.createSpy('spy1');
			var spy2=jasmine.createSpy('spy2');
			
			disp.on('foo', spy1).on('foo', spy2);
			disp.fire('foo');
			expect(spy1.calls.length).toEqual(1);
			expect(spy2.calls.length).toEqual(1);
			disp.off(null,spy1);
			disp.fire('foo');
			expect(spy1.calls.length).toEqual(1);
			expect(spy2.calls.length).toEqual(2);
		});
		
		xit('support signals',function(){
			var ev=new Events();
			var cb=jasmine.createSpy('cb');
			ev.one('click', cb);
			expect(cb.calls.length).toEqual(0);
			ev.trigger('click');
			expect(cb.calls.length).toEqual(1);
			ev.trigger('click');
			expect(cb.calls.length).toEqual(1);
			ev.one('click', cb);
			ev.off('click', cb);
			ev.trigger('click');
			expect(cb.calls.length).toEqual(1);
		});
	})
	
	xdescribe('support name spaces', function(){
		var disp=new Events();
		it('and should trigger by namespace', function(){
			var spy1=jasmine.createSpy('spy1');
			var spy2=jasmine.createSpy('spy2');
			disp.on('foo',spy1);
			disp.on('foo.name',spy2);
			
			disp.fire('foo');
			expect(spy1.calls.length).toEqual(1);
			expect(spy2.calls.length).toEqual(1);
			
			disp.fire('foo.name');
			expect(spy1.calls.length).toEqual(1);
			expect(spy2.calls.length).toEqual(2);
			
			disp.fire('foo.another');
			expect(spy1.calls.length).toEqual(1);
			expect(spy2.calls.length).toEqual(2);
			
			var spy3=jasmine.createSpy('spy3');
			disp.on('bar.foo',spy3);
			
			disp.fire('bar.foo');
			expect(spy3.calls.length).toEqual(1);
			disp.fire('foo.name bar.foo');
			expect(spy1.calls.length).toEqual(1);
			expect(spy2.calls.length).toEqual(3);
			expect(spy3.calls.length).toEqual(2);
		//*/
		})
		
		it('and should unbind by namespace', function(){
			var spy1=jasmine.createSpy('spy1');
			var spy2=jasmine.createSpy('spy2');
			var spy3=jasmine.createSpy('spy2');
			
			disp.on('foo.bar',spy3);
			disp.on('foo.name',spy1);
			disp.on('foo',spy2);
			
			disp.off('foo.name');
			disp.fire('foo');
			
			expect(spy1.calls.length).toEqual(0);
			expect(spy2.calls.length).toEqual(1);
			expect(spy3.calls.length).toEqual(1);
			
			disp.off('.bar');
			disp.fire('foo');
			expect(spy3.calls.length).toEqual(1);
		})
		
		
		
	})
})