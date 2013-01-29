describe('Observable', function(){

	it('construct', function(){
		var obs=Observable();
		expect(obs()).toBeUndefined();
		var spy=jasmine.createSpy('spy');
		obs.subscribe(spy);
		expect(spy).not.toHaveBeenCalled();
		obs(1);
		expect(spy).toHaveBeenCalled();
		expect(obs()).toBe(1);
		obs(1);
		expect(spy.calls.length).toBe(1);
		obs(1231);
		expect(spy.calls.length).toBe(2);
		obs({});
		expect(spy.calls.length).toBe(3);
		obs({});
		expect(spy.calls.length).toBe(4);
	});
	
	it('Computed', function(){
		var price=Observable(0);
		var currency=Observable('UAH');
		var priceCurrency=Computed(function(){
			return price()+' '+currency();
		});
		var spy=jasmine.createSpy('spy');
		priceCurrency.subscribe(spy);
		expect(priceCurrency()).toBe('0 UAH');
		expect(spy.calls.length).toBe(0);
		price(10);
		currency('BYR');
		expect(priceCurrency()).toBe('10 BYR');
		expect(spy.calls.length).toBe(2);
	});
	
	it('Computed async', function(){
		var price=Observable(0);
		var currency=Observable('UAH');
		var priceCurrency=Computed(function(){
			return price()+' '+currency();
		},undefined,true);//true -> async
		var spy=jasmine.createSpy('spy');
		priceCurrency.subscribe(spy);
		
		expect(priceCurrency()).toBe('0 UAH');
		
		//задаем 2 разных параметра вызов шпиона 1 раз
		runs(function(){
			price(10);
			currency('BYR');
		});
		
		waitsFor(function() {
			return spy.calls.length==1;
		});
		
		runs(function () {
			expect(priceCurrency()).toBe("10 BYR");
			expect(spy.calls.length).toBe(1);
			
			
		});
		
		runs(function(){
			price(20);
			currency('RUR');
		});
		
		waitsFor(function() {
			return spy.calls.length==2;
		});
		
		runs(function () {
			expect(priceCurrency()).toBe("20 RUR");
			expect(spy.calls.length).toBe(2);
		});
		
		
	});
	
	it('Computed of computed', function(){
		var price=Observable(10);
		var currency=Observable('USD');
		var priceCurrency=Computed(function(){
			return price()+' '+currency();
		},this,true);
		
		var supportString=Observable('Service support');
		var supportPhone=Observable('13322444');
		var priceString=Observable('Price');
		var support=Computed(function(){
			return supportString()+': '+supportPhone();
		},this,true);
		
		var alltext=Computed(function(){
			return priceString()+': '+priceCurrency()+'. '+support();
		},this,true);
		expect(alltext()).toBe('Price: 10 USD. Service support: 13322444');
		
		var spy=jasmine.createSpy('spy');
		priceCurrency.subscribe(spy);
		
		//change locale
		runs(function(){
			price(300);
			currency('RUR');
			supportString('Служба поддержки');
			priceString('Цена');
		});
		
		waitsFor(function() {
			return spy.calls.length==1;
		});
		
		waits(500);
		
		runs(function(){
			expect(alltext()).toBe('Цена: 300 RUR. Служба поддержки: 13322444');
			expect(spy.calls.length).toBe(1);
		});
		
		
	});
});