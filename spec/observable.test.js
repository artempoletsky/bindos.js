describe('Observable', function () {
    it('fires when object is changed', function () {
        var obs=Observable({});
        var spy=jasmine.createSpy();
        obs.subscribe(spy);
        expect(spy).not.toHaveBeenCalled();
        obs({
            a: 'a'
        });
        expect(spy).toHaveBeenCalled();
    });



    it('construct', function () {
        var obs = Observable();
        expect(obs()).toBeUndefined();
        var spy = jasmine.createSpy('subscribe callback');
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

    it('has fire method', function () {
        var obs = Observable("foo");

        var spy = jasmine.createSpy('subscribe callback');
        obs.subscribe(spy);
        expect(spy).not.toHaveBeenCalled();
        obs.fire();
        expect(spy.calls.length).toBe(1);
        expect(spy.calls[0].args[0]).toBe("foo");
    });

    it('Computed', function () {
        var price = Observable(0);
        var currency = Observable('UAH');
        var priceCurrency = Computed({
            get: function () {
                return price() + ' ' + currency();
            },
            async: false
        });
        var spy = jasmine.createSpy('subscribe callback');
        priceCurrency.subscribe(spy);
        expect(priceCurrency()).toBe('0 UAH');
        expect(spy.calls.length).toBe(0);
        price(10);
        currency('BYR');
        expect(priceCurrency()).toBe('10 BYR');
        expect(spy.calls.length).toBe(2);
    });

    xit('Computed async', function () {
        var price = Observable(0);
        var currency = Observable('UAH');
        var priceCurrency = Computed(function () {
            return price() + ' ' + currency();
        }, undefined, true);//true -> async
        var spy = jasmine.createSpy('spy');
        priceCurrency.subscribe(spy);

        expect(priceCurrency()).toBe('0 UAH');

        //задаем 2 разных параметра вызов шпиона 1 раз
        runs(function () {
            price(10);
            currency('BYR');
        });

        waitsFor(function () {
            return spy.calls.length == 1;
        });

        runs(function () {
            expect(priceCurrency()).toBe("10 BYR");
            expect(spy.calls.length).toBe(1);


        });

        runs(function () {
            price(20);
            currency('RUR');
        });

        waitsFor(function () {
            return spy.calls.length == 2;
        });

        runs(function () {
            expect(priceCurrency()).toBe("20 RUR");
            expect(spy.calls.length).toBe(2);
        });


    });

    it('Computed of computed', function () {
        var price = Observable(10);
        var currency = Observable('USD');
        var priceCurrency = Computed(function () {
            return price() + ' ' + currency();
        });

        var supportString = Observable('Service support');
        var supportPhone = Observable('13322444');
        var priceString = Observable('Price');
        var support = Computed(function () {
            return supportString() + ': ' + supportPhone();
        });

        var alltext = Computed(function () {
            return priceString() + ': ' + priceCurrency() + '. ' + support();
        });
        expect(alltext()).toBe('Price: 10 USD. Service support: 13322444');

        var spy = jasmine.createSpy('spy');
        priceCurrency.subscribe(spy);

        price(300);
        currency('RUR');
        supportString('Служба поддержки');
        priceString('Цена');

        expect(alltext()).toBe('Цена: 300 RUR. Служба поддержки: 13322444');



    });


    it('Computed construct from options object', function () {
        var leftIndex = Observable(0);
        var topIndex = Observable(0);

        var index = Computed({
            get: function () {
                return topIndex() * 5 + leftIndex();
            },
            set: function (val) {
                leftIndex(val - topIndex(Math.floor(val / 5)) * 5)
            }
        });

        index(8);
        expect(leftIndex()).toBe(3);
        expect(topIndex()).toBe(1);
        expect(index()).toBe(8);
    });

    it('computed subscribes to observables only once', function () {
        var obs = Observable(0);
        var comp = Computed(function () {
            return obs() + obs();
        });
        var comp2 = Computed(function () {
            return comp() + comp() + obs() + obs() + obs();
        });
        var spy = jasmine.createSpy();
        var spy2 = jasmine.createSpy();
        comp.subscribe(spy);
        comp2.subscribe(spy2);
        expect(spy.calls.length).toBe(0);
        obs(1);
        expect(spy.calls.length).toBe(1);
        expect(spy2.calls.length).toBe(1);

        obs(0);
        expect(spy.calls.length).toBe(2);

        expect(spy2.calls.length).toBe(2);
    });

    xit('async computed steals value change', function () {
        var obs = Observable(5);
        var comp = Computed({
            get: function () {
                return obs();
            },
            async: true
        });
        var spy = jasmine.createSpy();
        comp.subscribe(spy);

        obs(10);
        obs(5);

        waits(100);

        runs(function () {
            expect(spy.calls.length).toBe(0);
            expect(comp()).toBe(5);
        });
    });
});