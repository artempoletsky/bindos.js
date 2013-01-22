describe('Class', function(){
	it('can construct',function(){
		var c=new Class();
		expect(c instanceof Class).toBe(true);
		expect(c.constructor).toBe(Class);
	});
	
	it('extendable',function(){
		var Child=Class.extend({
			a: 0,
			method: function(){
				this.a=2;
			}
		});
		var c=new Child();
		expect(c.a).toBe(0);
		expect(c.method).toBeDefined();
		c.method();
		expect(c.a).toBe(2);
	});
	
	it('child has own constructor',function(){
		var Child=Class.extend({
			constructor: function(options){
				this.name='Child';
				this.options=options;
			}
		});
		var o={};
		var c=new Child(o);
		expect(c.name).toBe('Child');
		expect(c.options).toBe(o);
		
		var Deeper=Child.extend({
			constructor: function(){
				this.name='Deeper';
				this.options=false;
			}
		});
		var d=new Deeper();
		expect(d.name).toBe('Deeper');
		expect(d.options).toBe(false);
		expect(d instanceof Deeper).toBe(true);
		expect(c instanceof Child).toBe(true);
	});
	
	it('child methods can call _super method',function(){
		var Person=Class.extend({
			isDancing: false,
			dance: function(){
				this.isDancing=true;
			},
			times: 0,
			tick: function(){
				this.times++;
				return this.times;
			},
			constructor: function(){
				this.iAmPerson=true;
			}
		});
		var Nynja=Person.extend({
			constructor: function(){
				this._super();
				this.iAmNynja=true;
			},
			dance: function(){
				this._super();
			},
			tick: function(){
				return this._super();
			}
		});
		var john=new Nynja();
		expect(john.iAmPerson).toBe(true);
		expect(john.iAmNynja).toBe(true);
		expect(john.isDancing).toBe(false);
		john.dance();
		expect(john.isDancing).toBe(true);
		
		expect(john.times).toBe(0);
		john.tick();
		expect(john.times).toBe(1);
		expect(john.tick()).toBe(2);
		
	});
	it('child without constructor must construct with parent constructor', function(){
		var Child=Class.extend({
			constructor: function(a,b,c){
				this.a=a;
				this.b=b;
				this.c=c;
			}
		});
		var Deeper=Child.extend({});
		expect(Deeper.prototype._constructor).toBe(Child.prototype._constructor);
		var d=new Deeper(1,2,3);
		expect(d.a).toBe(1);
		expect(d.b).toBe(2);
		expect(d.c).toBe(3);
	});
	
	it('has factory',function(){
		var Child=Class.extend({
			constructor: function(a,b,c){
				this.a=a;
				this.b=b;
				this.c=c;
			}
		});
		var c=Child.create({
			d: 4
		},1,2,3);
		expect(c.a).toBe(1);
		expect(c.b).toBe(2);
		expect(c.c).toBe(3);
		expect(c.d).toBe(4);
		
	});
});