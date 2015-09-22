describe('Model', function () {

    it('can construct from json', function () {
        var m = new Model({
            "x": "10"
        });
        expect(m.prop("x")).toBe("10");
    })
    it('has id property equal to id attribute', function () {
        var m = new Model({
            id: 10
        });
        expect(m.id).toBe(10);
        var Book = Model.extend({
            idAttribute: 'idBook',
            mapping: 'book'
        });
        var b = new Book({
            idBook: 5
        });
        expect(b.id).toBe(5);
    })
    it('can map to global collection', function () {
        var Book = Model.extend({
            mapping: 'book',
            idAttribute: 'idBook'
        });

        var m = new Book({
            "x": "10",
            "idBook": 1
        });
        var m2 = Model.fromStorage('book', 1);
        expect(m).toBe(m2);

        m2.update({
            "x": "20"
        })
        expect(m.prop('x')).toEqual('20');

        var m3 = Model.createOrUpdate(Book, {
            idBook: 1,
            x: 0
        })
        expect(m3).toBe(m2);
        expect(m.prop('x')).toBe(0);
    });
    it('\'s prop method can get and set attribute', function () {
        var m = Model.create({}, {
            a: 10
        });
        var spy = jasmine.createSpy('spy');
        var spyOnA = jasmine.createSpy('spyOnA');
        var spyOnB = jasmine.createSpy('spyOnB');
        m.on('change', spy);
        m.on('change:a', spyOnA);
        m.on('change:b', spyOnB);
        expect(m.prop('a')).toBe(10);
        expect(spy.calls.length).toBe(0);
        expect(spyOnA.calls.length).toBe(0);
        expect(spyOnB.calls.length).toBe(0);
        m.prop('a', 20);
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

    it('save', function () {
        var oldSync = Model.sync;
        var method, url, attributes, hasId = false;
        Model.sync = function (a, b, options) {
            method = a;
            url = b;
            attributes = options;
            if (hasId) {
                options.success({});
            }
            else {
                options.success({
                    id: 123
                });
            }
        }

        var m = Model.create({
            defaults: {
                id: undefined
            },
            mapping: 'foo'
        });
        m.prop('x', 10);
        m.save();
        expect(method).toBe('create');
        expect(url).toBe('/foo/');
        expect(JSON.stringify(attributes.data)).toBe('{"x":10}');
        expect(m.id).toBe(123);
        hasId = true;
        m.save();
        expect(method).toBe('create');

        m.prop({
            foo: 'bar'
        }).save();
        expect(method).toBe('update');
        expect(url).toBe('/foo/123/');
        expect(JSON.stringify(attributes.data)).toBe('{"foo":"bar"}');
        expect(JSON.stringify(m._changed)).toBe('{}');
        Model.sync = oldSync;
    });

    it('fetch', function () {
        var oldSync = Model.sync;
        var method, url, attributes, hasId = false;
        Model.sync = function (a, b, c) {
            method = a;
            url = b;
            attributes = c;
            c.success({
                id: 20,
                a: 1,
                b: 2
            });
        }

        var m = Model.create({
            mapping: 'foo'
        }, {
            id: 20
        });
        var spyOnA = jasmine.createSpy('spyOnA');
        m.on('change:a', spyOnA);
        m.fetch();

        expect(method).toBe('get');
        expect(url).toBe('/foo/20/');
        expect(m.prop('a')).toBe(1);
        expect(m.prop('b')).toBe(2);
        expect(spyOnA.calls.length).toBe(1);

        Model.sync = oldSync;
    });

    it('remove', function () {
        var oldSync = Model.sync;
        var method, url, attributes, hasId = false;
        Model.sync = function (a, b, c) {
            method = a;
            url = b;
            attributes = c;
        }
        var spy = jasmine.createSpy('spy');
        var m = Model.create({
            mapping: 'foo'
        }, {
            id: 20
        });
        m.on('remove', spy);
        m.remove();

        expect(method).toBe('delete');
        expect(url).toBe('/foo/20/');
        expect(spy.calls.length).toBe(1);
        Model.sync = oldSync;
    });

    it('create or update', function () {
        var m = Model.createOrUpdate(Model, {
            x: 1,
            y: 2
        });
        expect(m.prop('x')).toBe(1);
        expect(m.prop('y')).toBe(2);
    });


    it('supports computed properties', function () {
        var m = Model.create({
            defaults: {
                x: 10,
                y: 0
            },
            computeds: {
                x2: {
                    deps: ['x'],
                    get: function (x) {
                        return x * 2;
                    },
                    set: function (value) {
                        this.prop('x', value / 2);
                    }
                }
            }
        });

        expect(m.computeds.x2).toBeDefined();


        //check init
        expect(m.prop('x')).toBe(10);
        expect(m.prop('x2')).toBe(20);


        //check set by attribute
        var spy = jasmine.createSpy('double spy');
        m.on('change:x2', spy);
        expect(spy).not.toHaveBeenCalled();

        m.prop('x', 15);
        expect(spy).toHaveBeenCalled();
        expect(m.prop('x2')).toBe(30);

        //check set by computed
        m.prop('x2', 10);
        expect(m.prop('x')).toBe(5);


        m.addComputed('sum', {
            deps: ['x', 'y'],
            get: function (x, y) {
                return x + y;
            }
        });
        var spy2 = jasmine.createSpy('sum spy');

        expect(m.prop('sum')).toBe(5);

        m.on('change:sum', spy2);

        m.prop('y', 10);

        expect(spy2).toHaveBeenCalled();

        expect(m.prop('sum')).toBe(15);


    });


    it('supports define property syntax', function () {

        var model = Model.create({
            useDefineProperty: true,
            defaults: {
                foo: 'bar',
                a: 1
            },
            computeds: {
                comp1: {
                    deps: ['foo', 'a'],
                    get: function (foo, a) {
                        return foo + ' ' + a;
                    }
                }
            }
        });

        expect(model.foo).toBe('bar');
        expect(model.comp1).toBe('bar 1');
        expect(model.a).toBe(1);

        model.a++;

        expect(model.a).toBe(2);
        expect(model.comp1).toBe('bar 2');


        var ModelWithId = Model.extend({
            useDefineProperty: true,
            defaults: {
                id: 0
            }
        });

        var model2 = new ModelWithId({
            id: 20
        });
        expect(model2.id).toBe(20);


        model2.prop('id', 30)

        expect(model2.id).toBe(30);


        var ModelWithId2 = Model.extend({
            useDefineProperty: true,
            idAttribute: 'foo'
        });

        var model3 = new ModelWithId2();

        expect(model3.id).toBeUndefined();

        model3.prop('foo', 3);

        expect(model3.id).toBe(3);

        //console.log(model.toJSON());
    });


    describe('Model.Computed', function () {
        it('can construct', function () {
            var model = new Model();
            model.prop('x', 11);
            var comp = new Model.Computed({
                model: model,
                deps: ['x'],
                get: function (x) {
                    return x * 2;
                },
                set: function (value) {
                    this.prop('x', value / 2);
                }
            });

            expect(comp.value).toBe(22);
        });

        it('can be used without deps', function () {
            var model = Model.create({
                defaults: {
                    calls: 0
                },
                _x: 0,
                computeds: {
                    x: {
                        get: function () {
                            return this._x;
                        },
                        set: function (x) {
                            this.calls++;
                            this._x = x;
                        }
                    }
                }
            });
            expect(model.x).toBe(0);
            expect(model.calls).toBe(0);
            model.x = 20;
            expect(model.x).toBe(20);
            expect(model.calls).toBe(1);

            var spy = jasmine.createSpy('event_test');

            expect(spy).not.toHaveBeenCalled();

            model.on('change:x', spy);

            model.x = 10;

            expect(spy).toHaveBeenCalled();
            expect(model.x).toBe(10);

        });


        xit('can parse filters', function () {
            var f = Model.parseFilters('x | filter1 | filter2: "8"');
            expect(f.filters.filter2).toBe('8');

        });
    });


    var sumFilter = Model.filters.sumFilter = {
        format: function (value, option) {
            return value * 1 + option * 1;
        },
        unformat: function (value, option) {
            return value * 1 - option * 1;
        }
    };

    var squareFilter = Model.filters.squareFilter = {
        format: function (value, option) {
            return 1 * value * value;
        },
        unformat: function (value, option) {
            return Math.sqrt(1 * value);
        }
    };


    xdescribe('filters', function () {

        it('can create reusable filter', function () {
            expect(sumFilter.format(123, '2')).toBe(125);
            expect(sumFilter.unformat('125', '2')).toBe(123);
            expect(squareFilter.format(2)).toBe(4);
            expect(squareFilter.unformat('4')).toBe(2);
        });


        it('can create filtered computed', function () {
            expect(Model.filters.sumFilter).toBeDefined();
            expect(Model.filters.squareFilter).toBeDefined();
            var vm = ViewModel.create({
                defaults: {
                    value: 5
                }
            });

            var comp = new Model.Computed({
                model: vm,
                name: 'tempComputedName1'
            });


            comp.parseFilters("value | sumFilter:'2' | squareFilter");


            expect(comp.get()).toBe(7 * 7);

            comp.set(4 * 4);
            expect(vm.prop('value')).toBe(2);

            comp.set(18 * 18);
            expect(vm.prop('value')).toBe(16);
        });


    });

})