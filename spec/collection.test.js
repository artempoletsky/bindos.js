describe('Collection', function(){
	
	it('can construct from json', function(){
		//console.log(Collection.prototype);
		var c=new Collection([
		{
			id: 1
		},
		{
			id: 2
		},
		{
			id: 3
		}]);
		expect(c.getByID(1).get('id')).toBe(1);
	})
	it('can map to some model', function(){
		var Book=Model.extend({
			idAttribute: 'idBook',
			mapping: 'book'
		})
		var BooksCollection=Collection.extend({
			model: Book
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
		}
		]);
		expect(c.getByID(1).get('idBook')).toBe(1);
		
		var Car=Model.extend({
			mapping: 'car'
		});
		
		var CarCollection=Collection.extend({
			model: Car
		});
		var cc=new CarCollection();
		
	})
	
	it('support underscore metods', function(){
		var data=[];
		var len=100;
		for(var i=0;i<len;i++)
		{
			data.push({
				x: i
			});
		}
		var col=Collection.create({},data);
		
		var sorted=function(collection){
			var result=true;
			collection.each(function(model,index){
				if(model.get('x')!=index)
				{
					result=false;
				}
				return false;
			});
			return result;
		}
		//console.log(col.at(5).get('x'));
		expect(sorted(col)).toBe(true);
		col.itself.shuffle();
		//console.log(col.at(5).get('x'));
		expect(sorted(col)).toBe(false);
		
		col.itself.sortBy(function(model){
			return model.get('x');
		});
		//console.log(col.at(5).get('x'));
		expect(sorted(col)).toBe(true);
		
		var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
		'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
		'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex',
		'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
		'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];
		
		//map test
		var square=function(model){
			return model.prop('x')*model.prop('x')
		};
		var arr=col.map(square);
		var ind=Math.floor(Math.random()*len);
		var x=col.at(ind).get('x');
		expect(arr[ind]).toBe(x*x);
		
		
	})
	
})