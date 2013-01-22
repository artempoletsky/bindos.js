describe('require', function(){
	it('must load external js file',function(){
		require('spec/externalfile.js');
		expect(a).toBe(10);
		require('lib/jquery-1.8.2.min.js');
		expect($).toBeDefined();
		require('src/js/class.js');
		expect(Class).toBeDefined();
	});
	
	it('not load file twice',function(){
		a=20;
		require('spec/externalfile.js');
		expect(a).toBe(20);
	});
	
	it('throws error when file not exists',function(){
		expect(function(){
			require('not_exists');
		}).toThrow('File "not_exists" not exists!');
	});
	it('must contain log',function(){
		expect(require.log[0]).toBe('spec/externalfile.js');
		expect(require.log[1]).toBe('lib/jquery-1.8.2.min.js');
		//expect(require.log[3]).toBeUndefined();
	});
	it('can return list of included files as script tags', function(){
		console.log(require.unpack());
	});
});