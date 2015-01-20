/*globals describe, jasmine, expect, $, _, it, ViewModel, Observable*/
describe('ViewModel.binds', function () {
    "use strict";


    describe('standart', function () {

        describe('.html', function () {

            it('replaces innerHTML of HTMLElement the value of the concerned observable', function () {

                var vm = ViewModel.create({
                    el: '<div nk="html: value"></div>',
                    autoParseBinds: true,
                    defaults: {
                        value: '<span>Hello</span>'
                    }
                });


                expect(vm.$el.html().toLowerCase()).toBe('<span>hello</span>');

                vm.prop('value', undefined);
                expect(vm.$el.html()).toBe('');

                vm.prop('value', false);
                expect(vm.$el.html()).toBe('');

                vm.prop('value', null);
                expect(vm.$el.html()).toBe('');

                vm.prop('value', 0);
                expect(vm.$el.html()).toBe('0');
            });


            it('supports filters', function () {
                var vm = ViewModel.create({
                    el: '<div nk="html: value | tf1:\'321\'"></div>',
                    autoParseBinds: true,
                    defaults: {
                        value: 123
                    }
                });

                expect(vm.$el.html()).toBe('444');
            });
        });


        describe('.value', function () {

            it('binds observable to input value', function () {

                var vm = ViewModel.create({
                    el: '<input nk="value: value"/>',
                    autoParseBinds: true,
                    defaults: {
                        value: 'Hello'
                    }
                });
                expect(vm.$el.val()).toBe('Hello');


                vm.prop('value', undefined);
                expect(vm.$el.val()).toBe('');

                vm.prop('value', false);
                expect(vm.$el.val()).toBe('');

                vm.prop('value', null);
                expect(vm.$el.val()).toBe('');

                vm.prop('value', 0);
                expect(vm.$el.val()).toBe('0');


                vm.$el.val('abc');
                vm.$el.trigger('keyup');
                expect(vm.prop('value')).toBe('abc');
            });
        });


        describe('.withModel', function () {
            it('draws model', function () {

                var Hero = Model.extend({
                    defaults: {
                        name: ''
                    },
                    computeds: {
                        greet: {
                            deps: ['name'],
                            get: function (name) {
                                return 'My name is ' + name;
                            }
                        }
                    }
                });

                var superman = new Hero({
                    name: 'Superman'
                });

                var vm = ViewModel.create({
                    el: '<div><ul nk="withModel: hero"><li>{{name}} {{greet}}</li></ul></div>',
                    autoParseBinds: true,
                    defaults: {
                        hero: superman
                    },
                    computeds: {
                    }
                });


                expect(vm.$el.find('li').html()).toBe('Superman My name is Superman');

                var batman = new Hero({
                    name: 'Batman'
                });

                vm.prop('hero', batman);

                expect(vm.$el.find('li').html()).toBe('Batman My name is Batman');

            });


        });

        describe('.eachModel', function () {
            it('draws collection', function () {


                var collection = new Collection([
                    {name: 'Vasya'},
                    {name: 'Petya'}
                ]);


                expect(collection.length).toBe(2);
                var $cont = $('<div><ul nk="eachModel: collection"><li>{{name}}</li></ul></div>');
                ViewModel.findBinds($cont, {
                    collection: collection
                });

                expect($cont.find('li:eq(0)').html()).toBe('Vasya');
                expect($cont.find('li:eq(1)').html()).toBe('Petya');
                collection.at(0).prop('name', 'Sasha');
                expect($cont.find('li:eq(0)').html()).toBe('Sasha');
            });

            it("'s multiple refresh fix", function () {
                var AbilitiesCollection = Collection.extend({
                    parse: function (json) {
                        return _.map(json, function (name) {
                            return {
                                name: name
                            };
                        });
                    }
                });
                var Hero = Model.extend({
                    initialize: function () {
                        this.abilities = new AbilitiesCollection(this.prop('abilities'));
                    }
                });

                var heroes = Collection.create({
                    model: Hero
                }, [
                    {name: 'Batman', abilities: ['kung fu', 'money']},
                    {name: 'Superman', abilities: ['laser eyes', 'flying', 'bulletproof']}
                ]);


                var ctx = {
                    heroes: Observable(heroes)
                };
                var calls0 = 0;
                window.spy0 = function () {
                    calls0++;
                    return '';
                };

                var calls1 = 0;
                window.spy1 = function () {
                    calls1++;
                    return '';
                };

                var calls2 = 0;
                window.spy2 = function () {
                    calls2++;
                    return '';
                };


                var $cont = $('<div><ul nk="eachModel: heroes; attr: {nothing: spy0()}"><li nk="attr: {nothing: spy1()}">{{name}}: <ul nk="eachModel: $self().abilities"><li nk="attr: {nothing: spy2()}">{{name}},</li></ul></li></ul></div>');

                ViewModel.findBinds($cont, ctx);

                expect($cont.text()).toBe('Batman: kung fu,money,Superman: laser eyes,flying,bulletproof,');


                //console.log($cont);


                expect(calls0).toBe(1);

                expect(calls1).toBe(2);//two heroes

                expect(calls2).toBe(5);//5 abilities


                $cont.refreshBinds();


                expect(calls0).toBe(2);

                expect(calls1).toBe(4);

                expect(calls2).toBe(10);


                heroes.at(0).prop('name', 'Iron man');

                expect($cont.text()).toBe('Iron man: kung fu,money,Superman: laser eyes,flying,bulletproof,');

                expect(calls0).toBe(2);

                expect(calls1).toBe(5);

                expect(calls2).toBe(12);

            });

            it('supports table', function () {
                var table = $('<table nk="eachModel: collection"><tr><td>{{value}}</td></tr></table>');
                var ctx = {
                    collection: new Collection([
                        {value: "foo"}
                    ])
                };
                ViewModel.findBinds(table, ctx);
                expect(table.html().toLowerCase().replace(/\s+/g, '')).toBe('<tbody><tr><td>foo</td></tr></tbody>')
            });
        });
    });


    describe('inline modificators', function () {

        describe('{{}}', function () {
            it('inserts value of observable', function () {


                var vm = ViewModel.create({
                    el: '<div>Hello{{name}}! {{value}}<div>asd</div></div>',
                    autoParseBinds: true,
                    defaults: {
                        name: '<span style="color: green;">Moe</span>',
                        value: ''
                    }
                });


                expect(vm.$el.text()).toEqual('HelloMoe! asd');
                vm.prop('value', 12);
                expect(vm.$el.text()).toEqual('HelloMoe! 12asd');


            });


            it('supports filters', function () {

                var vm = ViewModel.create({
                    el: '<div>{{value | tf1:"321"}}</div>',
                    autoParseBinds: true,
                    defaults: {
                        value: 123
                    }
                });


                expect(vm.$el.html()).toBe('444');
            });

            it('supports custom regex', function () {

                var lastRegex = ViewModel.inlineModificators['{{}}'].regex;

                ViewModel.inlineModificators['{{}}'].regex = /\$\{([\s\S]+?)\}/g;

                var vm = ViewModel.create({
                    el: '<div>Hello ${name}! ${value}<div>asd</div></div>',
                    autoParseBinds: true,
                    defaults: {
                        name: '<span style="color: green;">Moe</span>',
                        value: ''
                    }
                });

                expect(vm.$el.text()).toBe('Hello Moe! asd');

                ViewModel.inlineModificators['{{}}'].regex = lastRegex;

            });


            it('supports empty values', function () {

                var vm = ViewModel.create({
                    el: '<div>{{name}}</div>',
                    autoParseBinds: true,
                    defaults: {
                        name: '<span style="color: green;">Moe</span>'
                    }
                });

                expect(vm.$el.text()).toBe('Moe');
                vm.prop('name', '');
                expect(vm.$el.text()).toBe('');
                vm.prop('name', 'Moe');
                expect(vm.$el.text()).toBe('Moe');
            });


            it('0 is not empty string', function () {

                var vm = ViewModel.create({
                    el: '<div>{{value}}</div>',
                    autoParseBinds: true,
                    defaults: {
                        value: 0
                    }
                });


                expect(vm.$el.html()).toBe('0');

                vm.prop('value', null);
                expect(vm.$el.html()).toBe('');
            });

            it('supports line breaks', function () {

                var vm = ViewModel.create({
                    el: '<div>\n\
        {{name}} \n\
            </div>',
                    autoParseBinds: true,
                    defaults: {
                        name: 'foo'
                    }
                });


                expect($.trim(vm.$el.text())).toBe('foo');
            });

        });


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
            this.findObservable($el.attr('value'), context, addArgs)
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
        ViewModel.customAttributes.lang = function ($el, value) {
            //value now is "hello"
            //$el now is $div

            //subscribe to change locale
            $el.html(lang()[value]);
            lang.subscribe(function (lang) {
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


});