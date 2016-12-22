/*globals describe, jasmine, expect, $, _, it, ViewModel, Observable, spyOn*/
describe('ViewModel', function () {
    "use strict";

    it('can parse options object', function () {

        var simpleRawOptions = '   {\n\
         model: Task,\n\
         add: todos | Math.floor(todos.length/2),\n\
         foo: bar\n\
         }\n\
         ';
        var simpleOptions = ViewModel.parseOptionsObject(simpleRawOptions);

        expect(simpleOptions.model).toBe('Task');
        expect(simpleOptions.add).toBe('todos | Math.floor(todos.length/2)');
        expect(simpleOptions.foo).toBe('bar');

        var rawOptions = '   {\n\
            model: Task,\n\
            b: {c: d},\
            submit: {\n\
                add: todos | Math.floor(todos.length/2),\n\
                foo: {\n\
                    bar: a,\n\
                    baz: sdfsdf\n\
                }\n\
            }\n\
        }\n\
           ';

        var options = ViewModel.parseOptionsObject(rawOptions);
        expect(options.model).toBe('Task');
        expect(options.submit.add).toBe('todos | Math.floor(todos.length/2)');
        expect(options.submit.foo.bar).toBe('a');
        expect(options.submit.foo.baz).toBe('sdfsdf');
        expect(options.b.c).toBe('d');
    });
    it('can create VM object', function () {
        var click = jasmine.createSpy('click');
        var vm;
        var obj = {
            el: 'div',
            initialize: function () {
            },
            events: {
                'click': 'onClick'
            },
            onClick: click
        };
        spyOn(obj, 'initialize');
        vm = ViewModel.create(obj);
        expect(obj.initialize.calls[0].object).toBe(vm);
        expect(obj.initialize).toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();
        vm.el.fire('click');
        expect(click).toHaveBeenCalled();
    });


    it('context of \'delegateEvents\' handlers must be this ViewModel', function () {
        var called = false;
        var vm = ViewModel.create({
            el: 'body',
            events: {
                'click': 'onClick'
            },
            onClick: function () {
                called = true;
                expect(this).toBe(vm);
            }
        });
        expect(vm.events.click).toEqual('onClick');
        expect(called).toBe(false);
        //$('body').append(vm.$el);
        vm.el.fire('click');
        expect(called).toBe(true);
    });

    it('can delegate events', function () {
        var div = $.make('div');
        div.innerHTML = '<div id="grand"><div class="father"><div class="child"></div></div></div>';
        var dom = div.firstChild;
        var spy = jasmine.createSpy();
        var vm = ViewModel.create({
            el: dom,
            events: {
                'click .child': 'onClick'
            },
            onClick: spy
        });
        expect(spy.calls.length).toBe(0);
        vm.el.fire('click');
        expect(spy.calls.length).toBe(0);
        //vm.$el.find('.child').click();
        vm.$('.child').fire('click');
        expect(spy.calls.length).toBe(1, 'calls length');
        expect(spy.calls[0].args[0].type).toBe('click', 'event type');
        expect(spy.calls[0].object).toBe(vm, 'context check');
    });
    it('can undelegate events', function () {
        var dom = $('<div id="grand"><div class="father"><div class="child"></div></div></div>');
        var spy = jasmine.createSpy();
        var vm = ViewModel.create({
            el: dom,
            events: {
                'click .child': 'onClick'
            },
            onClick: spy
        });
        var $child = vm.$el.find('.child');
        $child.click();
        expect(spy.calls.length).toBe(1);
        vm.undelegateEvents();
        $child.click();
        expect(spy.calls.length).toBe(1);
        vm.delegateEvents();
        $child.click();
        expect(spy.calls.length).toBe(2);
    });


    xit('each method must return this', function () {
        var vm = new ViewModel();
        var exclude = 'on,initialize,hasListener,get,$,setElement,one,bindToModel,_constructor';
        var me;
        _.each(vm, function (prop) {
            if (typeof vm[prop] == 'function' && exclude.indexOf(prop) == -1) {
                try {
                    me = vm[prop]();
                } catch (exception) {
                    throw Error(prop + ' throw error ' + exception.message);
                }
                if (me !== vm) {
                    throw Error(prop + '() not return this');
                }
            }
        });

        me = vm.on('click', function () {
        });
        expect(me).toBe(vm);
        me = vm.one('click', function () {
        });
        expect(me).toBe(vm);
        me = vm.setElement(document.createElement('div'));
        expect(me).toBe(vm);
    });

    xit('observables has no _super', function () {
        var obs = Observable(' _super(); ');
        var vm = ViewModel.create({
            obs: obs
        });
        var called = 0;
        vm.obs.subscribe(function () {
            called++;
        });

        expect(vm.obs).toBe(obs);
        expect(called).toBe(0);
        vm.obs(1);
        expect(called).toBe(1);
    });

    it('has extended events behavior', function () {
        var spy = jasmine.createSpy('spy');

        var element = $.make('div');
        element.innerHTML = '<div><div class="trigger"></div><div class="trigger1"></div></div>';

        var vm = ViewModel.create({
            events: {
                'simpleFunction .trigger': spy,
                'click,anotherEvents': spy,
                'click,anotherEvents .trigger,div .trigger1': spy,
                'click,anotherEvents,onceMore': spy
            },
            el: element
        });
        vm.$('.trigger').fire('simpleFunction');
        expect(spy.calls.length).toBe(1);
        vm.el.fire('click');
        expect(spy.calls.length).toBe(3);
        vm.$('.trigger1').fire('anotherEvents');
        expect(spy.calls.length).toBe(6);
        vm.el.fire('onceMore');
        expect(spy.calls.length).toBe(7);
        vm.undelegateEvents();
        vm.el.fire('onceMore');
        expect(spy.calls.length).toBe(7);
    });


    it('parseOptionsObject', function () {

        //console.log(ViewModel.parseOptionsObject('a:b'));
        //console.log(ViewModel.parseOptionsObject('{a:b'));
        //ViewModel.parseOptionsObject('{}')
        expect(function () {
            ViewModel.parseOptionsObject('{ a : b }');
        }).not.toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('{}');
        }).not.toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('{a:b');
        }).toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('a:b');
        }).toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('{a:}');
        }).not.toThrow();
        expect(ViewModel.parseOptionsObject('{a:b}').a).toBe('b');
        expect(ViewModel.parseOptionsObject('{asdvccbt:erwer}').asdvccbt).toBe('erwer');
        expect(ViewModel.parseOptionsObject('{\n\
											asdvccbt:\n\
											erwer\n\
											}').asdvccbt).toBe('erwer');
    });

    it('supports shortcuts', function () {
        let div = $.make('div');
        div.innerHTML = '<div class="foo"></div>';

        var view = ViewModel.create({
            el: div,
            shortcuts: {
                '$foo': '.foo'
            }
        });
        expect(view.$foo).toBe(div.$('.foo'));
    });


    describe('findBinds', function () {
        it('can parse binds from html', function () {

            var div = $.make('div');
            div.setAttribute('data-bind', 'html: name');
            ViewModel.create({
                el: div,
                autoParseBinds: true,
                defaults: {
                    name: 'Moe'
                }
            });
            expect(div.innerHTML).toBe('Moe');
        });

        it('has not strong binds syntax', function () {
            ViewModel.binds.foo = function (elem, value, context) {

            };
            ViewModel.binds.bar = function (elem, value, context) {

            };
            spyOn(ViewModel.binds, 'foo');
            spyOn(ViewModel.binds, 'bar');
            var el = $.parse('<div data-bind="foo"><div data-bind="bar: baz;"></div></div>');
            ViewModel.findBinds(el, window);
            expect(ViewModel.binds.foo.calls.length).toBe(1);
            expect(ViewModel.binds.foo.calls[0].args[1]).toBe('');
            expect(ViewModel.binds.foo.calls[0].args[2]).toBe(window);
            expect(ViewModel.binds.bar.calls.length).toBe(1);
            expect(ViewModel.binds.bar.calls[0].args[1]).toBe('baz');
            expect(ViewModel.binds.bar.calls[0].args[2]).toBe(window);
        });

        it('throws exeption when query returns zero length result', function () {
            expect(function () {
                ViewModel.findBinds('not_exists');
            }).toThrow(new Error("Element not exists"));
        });

        it('has optional parameters', function () {
            var spy = ViewModel.binds.spy = jasmine.createSpy()

            var div = $.parse('<div data-bind="spy"></div>');

            ViewModel.findBinds(div);
            expect(spy.calls.length).toBe(1);
            expect(spy.calls[0].object).toBe(ViewModel);
            expect(spy.calls[0].args[0]).toBe(div);
            expect(spy.calls[0].args[1]).toBe('');
            expect(spy.calls[0].args[2]).toBeUndefined();
            expect(spy.calls[0].args[3]).toBeUndefined();
        });

        it('supports value bind', function () {
            var vm = ViewModel.create({
                el: $.parse('<input data-bind="value: value"/>'),
                autoParseBinds: true,
                defaults: {
                    value: 3
                }
            });
            expect(vm.value).toBe(3);
            expect(vm.el.value).toBe('3');
            vm.value = 10;
            expect(vm.el.value).toBe('10');

            vm.el.value = 50;

            vm.el.fire('change');

            expect(vm.value).toBe('50');
        });
    });

});