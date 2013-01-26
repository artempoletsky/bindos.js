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
	it('prop',function(){
		var m=Model.create({
			
			},{
				a: 10
			});
		expect(m.prop('a')).toBe(10);
		m.prop('a',20);
		expect(m.prop('a')).toBe(20);
		m.prop({
			a: 21,
			b: "foo"
		});
		expect(m.prop('a')).toBe(21);
		expect(m.prop('b')).toBe("foo");
	});
	
	
})