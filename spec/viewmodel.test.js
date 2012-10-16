describe('Events', function(){
	var disp=new Events();
	
	describe('support one single event',function(){
		
	})
	
	describe('support name spaces', function(){
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