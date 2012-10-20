describe('Model', function(){

	it('can construct from json', function(){
		var m=new Model({
			"x": "10"
		});
		expect(m.get("x")).toBe("10");
	})
	it('can map to global collection', function(){
		var m=new Model({
			"x": "10",
			"id": 1,
		},{
			mapping: 'book'
		});
		
		var m2=Model.fromStorage('book', 1);
		expect(m).toBe(m2);
		m2.update({
			"x": "20"
		})
		expect(m.get('x')).toEqual('20');
	})
})