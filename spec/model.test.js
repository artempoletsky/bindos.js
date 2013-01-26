describe('Model', function(){
	
	it('can construct from json', function(){
		var m=new Model({
			"x": "10"
		});
		expect(m.get("x")).toBe("10");
	})
	it('has id property equal to id attribute', function(){
		var m=new Model({
			id: 10
		});
		expect(m.id).toBe(10);
		var Book=Model.extend({
			idAttribute: 'idBook',
			mapping: 'book'
		});
		var b=new Book({
			idBook: 5
		});
		expect(b.id).toBe(5);
	})
	it('can map to global collection', function(){
		var Book=Model.extend({
			mapping: 'book',
			idAttribute: 'idBook'
		});
		
		var m=new Book({
			"x": "10",
			"idBook": 1
		});
		var m2=Model.fromStorage('book', 1);
		expect(m).toBe(m2);
	
		m2.update({
			"x": "20"
		})
		expect(m.get('x')).toEqual('20');
		
		var m3=Model.createOrUpdate(Book, {
			idBook: 1,
			x: 0
		})
		expect(m3).toBe(m2);
		expect(m.get('x')).toBe(0);
	});
	it('\'s prop method can get and set attribute',function(){
		var m=Model.create({
			
			},{
				a: 10
			});
		var spy=jasmine.createSpy('spy');
		var spyOnA=jasmine.createSpy('spyOnA');
		var spyOnB=jasmine.createSpy('spyOnB');
		m.on('change',spy);
		m.on('change:a',spyOnA);
		m.on('change:b',spyOnB);
		expect(m.prop('a')).toBe(10);
		expect(spy.calls.length).toBe(0);
		expect(spyOnA.calls.length).toBe(0);
		expect(spyOnB.calls.length).toBe(0);
		m.prop('a',20);
		expect(spy.calls.length).toBe(1);
		expect(spyOnA.calls.length).toBe(1);
		expect(spyOnB.calls.length).toBe(0);
		expect(m.prop('a')).toBe(20);
		m.prop({
			a: 21,
			b: "foo"
		});
		expect(spy.calls.length).toBe(2);
		expect(spyOnA.calls.length).toBe(2);
		expect(spyOnB.calls.length).toBe(1);
		expect(m.prop('a')).toBe(21);
		expect(m.prop('b')).toBe("foo");
	});
	
	it('save',function(){
		var oldSync=Model.sync;
		var method,url,attributes,hasId=false;
		Model.sync=function(a,b,c){
			method=a;
			url=b;
			attributes=c;
			if(hasId)
				c.success({});
			else
				c.success({
					id: 123
				});
		}
		
		var m=Model.create({
			mapping: 'foo'
		});
		m.prop('x',10);
		m.save();
		expect(method).toBe('create');
		expect(url).toBe('/foo/');
		expect(JSON.stringify(attributes.data)).toBe('{"x":10}');
		expect(m.id).toBe(123);
		hasId=true;
		m.save();
		expect(method).toBe('create');
		
		m.prop({
			foo: 'bar',
		}).save();
		expect(method).toBe('update');
		expect(url).toBe('/foo/123/');
		expect(JSON.stringify(attributes.data)).toBe('{"foo":"bar"}');
		expect(JSON.stringify(m._changed)).toBe('{}');
		Model.sync=oldSync;
	});
	
	
})