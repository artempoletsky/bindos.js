describe('ViewModel', function () {
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
        var obj = {
            el: 'div',
            initialize: function () {
                expect(this).toBe(vm);
            },
            events: {
                'click': 'onClick'
            },
            onClick: click
        }
        spyOn(obj, 'initialize')
        var vm = ViewModel.create(obj);
        expect(obj.initialize).toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();

    })


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
        vm.$el.click();
        expect(called).toBe(true);
    })

    it('can delegate events', function () {

        var dom = $('<div id="grand"><div class="father"><div class="child"></div></div></div>');
        var spy = jasmine.createSpy();
        var vm = ViewModel.create({
            el: dom,
            events: {
                'click .child': 'onClick'
            },
            onClick: spy
        });
        expect(spy.calls.length).toBe(0);
        vm.$el.click();
        expect(spy.calls.length).toBe(0);
        vm.$el.find('.child').click();
        expect(spy.calls.length).toBe(1);
        expect(spy.calls[0].args[0].type).toBe('click');
        expect(spy.calls[0].object).toBe(vm);
    })
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
    })
    it('can parse binds from html', function () {

        var $div = $('<div data-bind="html: name"></div>');
        ViewModel.findBinds($div, {
            name: 'Moe'
        });
        expect($div.html()).toBe('Moe');
    });

    it('With support', function () {

        var $div = $('<div class="nav_target header-item header-speed-test"' +
            'data-bind="with: SpeedTest;' +
            //'voice: speedtest,v_navigation;' +
            "!css: {voicelink: rating()<2,nav_target: rating()<2};" +
            'events: {click: click, voice: click}">' +
            '<b class="l"></b><b class="r"></b>' +
            '<span class="c"><i class="speedtest_icon" data-bind="className: \'speedtest_icon_\'+rating()"></i></span>' +
            '</div>');
        ViewModel.findBinds($div, {
            SpeedTest :{
                click: function(){},
                rating: Observable('1')
            }
        });

        expect($div.find('.speedtest_icon').hasClass('speedtest_icon_1')).toBe(true);
    })

    it('each method must return this', function () {
        var vm = new ViewModel();
        var exclude = 'on,initialize,hasListener,get,$,setElement,one,bindToModel,_constructor';
        var me;
        for (var prop in vm) {
            if (typeof vm[prop] == 'function' && !~exclude.indexOf(prop)) {
                try {
                    me = vm[prop].call(vm);
                } catch (exception) {
                    throw Error(prop + ' throw error ' + exception.message);
                    break;
                }
                if (me !== vm) {
                    throw Error(prop + '() not return this');
                }
            }
        }
        me = vm.on('click', function () {
        });
        expect(me).toBe(vm);
        me = vm.one('click', function () {
        });
        expect(me).toBe(vm);
        me = vm.setElement(document.createElement('div'));
        expect(me).toBe(vm);
    })

    it('observables has no _super', function () {
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
        var element = $('<div><div><div class="trigger"></div><div class="trigger1"></div></div></div>')[0];
        window.foo = {
            bar: function () {
            }
        }
        spyOn(foo, 'bar');
        var vm = ViewModel.create({
            events: {
                'simpleFunction .trigger': spy,
                'globalFunction .trigger': foo.bar,
                'click,anotherEvents': spy,
                'click,anotherEvents .trigger,div .trigger1': spy,
                'click,anotherEvents,onceMore': spy
            },
            el: element
        });
        vm.$el.find('.trigger').trigger('simpleFunction');
        expect(spy.calls.length).toBe(1);
        vm.$el.find('.trigger').trigger('globalFunction');
        expect(foo.bar.calls.length).toBe(1);
        vm.$el.click();
        expect(spy.calls.length).toBe(3);
        vm.$el.find('.trigger1').trigger('anotherEvents');
        expect(spy.calls.length).toBe(6);
        vm.$el.trigger('onceMore');
        expect(spy.calls.length).toBe(7);
        vm.undelegateEvents();
        vm.$el.trigger('onceMore');
        expect(spy.calls.length).toBe(7);
    });

    it('not strong binds syntax', function () {
        ViewModel.binds.foo = function (elem, value, context, addArgs) {

        }
        ViewModel.binds.bar = function (elem, value, context, addArgs) {

        }
        spyOn(ViewModel.binds, 'foo');
        spyOn(ViewModel.binds, 'bar');
        var el = $('<div data-bind="foo"><div data-bind="bar: baz;"></div></div>')[0];
        ViewModel.findBinds(el, window);
        expect(ViewModel.binds.foo.calls.length).toBe(1);
        expect(ViewModel.binds.foo.calls[0].args[0]).toBe(el);
        expect(ViewModel.binds.foo.calls[0].args[1]).toBe('');
        expect(ViewModel.binds.foo.calls[0].args[2]).toBe(window);
        expect(ViewModel.binds.bar.calls.length).toBe(1);
        expect(ViewModel.binds.bar.calls[0].args[0]).toBe(el.childNodes[0]);
        expect(ViewModel.binds.bar.calls[0].args[1]).toBe('baz');
        expect(ViewModel.binds.bar.calls[0].args[2]).toBe(window);

    });

    it('parseOptionsObject', function () {

        //console.log(ViewModel.parseOptionsObject('a:b'));
        //console.log(ViewModel.parseOptionsObject('{a:b'));
        //ViewModel.parseOptionsObject('{}')
        expect(function () {
            ViewModel.parseOptionsObject('{ a : b }')
        }).not.toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('{}')
        }).not.toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('{a:b')
        }).toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('a:b')
        }).toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('{a:}')
        }).not.toThrow();
        expect(ViewModel.parseOptionsObject('{a:b}').a).toBe('b');
        expect(ViewModel.parseOptionsObject('{asdvccbt:erwer}').asdvccbt).toBe('erwer');
        expect(ViewModel.parseOptionsObject('{\n\
											asdvccbt:\n\
											erwer\n\
											}').asdvccbt).toBe('erwer');
    });


    it('support {{}}', function () {
        var $div = $('<div>Hello {{name}}! {{value}}<div>asd</div></div>');
        var ctx = {
            name: Observable('Moe'),
            value: Observable('')
        };
        ViewModel.findBinds($div[0], ctx);

        expect($div.text()).toBe('Hello Moe! asd');
        ctx.value(12);
        expect($div.text()).toBe('Hello Moe! 12asd');

        ViewModel.inlineModificators['{{}}'].regex = /\$\{([\s\S]+?)\}/g;

        var $div2 = $('<div>Hello ${name}! ${value}<div>asd</div></div>');
        ViewModel.findBinds($div2[0], ctx);
        expect($div2.text()).toBe('Hello Moe! 12asd');

    });


    it('support custom tags', function () {
        //add custom tag
        ViewModel.tag('smartinput', function ($el, context, addArgs) {
            //template
            var $markup = $('<div class="my_cool_style"><input type="text"/></div>');

            //link to input
            var $input = $markup.find('input');

            //replace markup
            $el.after($markup).remove();

            //$el.attr('value') == 'name'
            //bind ctx.name to value of input
            this.findObservable(context, $el.attr('value'), addArgs)
                .callAndSubscribe(function (value) {
                    $input.val(value);
                });
        });
        var $div = $('<div><smartinput value="name"></smartinput></div>');
        var ctx = {
            name: 'Moe'
        };
        ViewModel.findBinds($div, ctx);
        expect($div.find('input').val()).toBe('Moe');
    });


    it('support custom attributes', function () {
        //en locale
        var lang = Observable({
            hello: 'Hello friend!',
            bye: 'Good bye friend!'
        });
        //creating new custom attribute
        ViewModel.customAttributes['lang'] = function ($el, value) {
            //value now is "hello"
            //$el now is $div

            //subscribe to change locale
            lang.callAndSubscribe(function (lang) {
                $el.html(lang[value]);
            });
        };
        var $div = $('<div lang="hello"></div>');
        ViewModel.findBinds($div);

        expect($div.html()).toBe('Hello friend!');

        //change locale to fr
        lang({
            hello: 'Bonjour ami!',
            bye: 'Au revoir ami!'
        });

        expect($div.html()).toBe('Bonjour ami!');

    });


})