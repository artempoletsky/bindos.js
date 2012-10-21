describe('Collection', function(){
	
	it('can construct from json', function(){
		var c=new Collection([
		{
			id: 1
		},

		{
			id: 2
		},

		{
			id: 3
		},
		]);
		expect(c.get(1).get('id')).toBe(1);
	})
	it('can map to some model', function(){
		var Book=Model.extend({
			idAttribute: 'idBook',
			mapping: 'book',
		})
		var BooksCollection=Collection.extend({
			model: Book,
		});
		var c=new BooksCollection([
		{
			idBook: 1
		},
		{
			idBook: 2
		},
		{
			idBook: 3
		},
		]);
		expect(c.get(1).get('idBook')).toBe(1);
		
		var Car=Model.extend({
			mapping: 'car',
		});
		
		var CarCollection=Collection.extend({
			model: Car,
		});
		var cc=new CarCollection();
		
	})
	
})