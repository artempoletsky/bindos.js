/*globals describe, jasmine, expect, $, _, it, ViewModel, Observable*/
describe('ViewModel.binds', function () {
    "use strict";

    var filter = ViewModel.filters.tf1 = {
        format: function (value, option) {
            return value * 1 + option * 1;
        },
        unformat: function (value, option) {
            return value * 1 - option * 1;
        }
    };

    var filter2 = ViewModel.filters.tf2 = {
        format: function (value, option) {
            return 1 * value * value;
        },
        unformat: function (value, option) {
            return Math.sqrt(1 * value);
        }
    };


    describe('filters', function () {

        it('can create reusable filter', function () {
            expect(filter.format(123, '2')).toBe(125);
            expect(filter.unformat('125', '2')).toBe(123);
            expect(filter2.format(2)).toBe(4);
            expect(filter2.unformat('4')).toBe(2);
        });


        it('can create filtered computed', function () {
            expect(ViewModel.filters.tf1).toBeDefined();
            expect(ViewModel.filters.tf2).toBeDefined();
            var ctx = {
                value: Observable(5)
            };
            var filtComp = ViewModel.applyFilters('value | tf1:\'13\' | tf2', ctx);
            expect(filtComp.get()).toBe(18 * 18);

            filtComp.set(4 * 4);
            expect(ctx.value()).toBe(4 - 13);

            filtComp.set(18 * 18);
            expect(ctx.value()).toBe(5);
        });


    });


    describe('standart', function () {
        describe('.with', function () {
            it('replaces context of view render', function () {

                var $div = $('<div class="nav_target header-item header-speed-test"' +
                    'data-bind="with: SpeedTest;' +
                    //'voice: speedtest,v_navigation;' +
                    "!css: {voicelink: rating()<2,nav_target: rating()<2};" +
                    'events: {click: click, voice: click}">' +
                    '<b class="l"></b><b class="r"></b>' +
                    '<span class="c"><i class="speedtest_icon" data-bind="className: \'speedtest_icon_\'+rating()"></i></span>' +
                    '</div>');
                ViewModel.findBinds($div, {
                    SpeedTest: {
                        click: function () {
                        },
                        rating: Observable('1')
                    }
                });

                expect($div.find('.speedtest_icon').hasClass('speedtest_icon_1')).toBe(true);
            });
        });


        describe('.html', function () {

            it('replaces innerHTML of HTMLElement the value of the concerned observable', function () {
                var $div = $('<div nk="html: value"></div>'),
                    ctx = {
                        value: Observable('<span>Hello</span>')
                    };
                ViewModel.findBinds($div, ctx);
                expect($div.html().toLowerCase()).toBe('<span>hello</span>');

                ctx.value(undefined);
                expect($div.html()).toBe('');

                ctx.value(false);
                expect($div.html()).toBe('');

                ctx.value(null);
                expect($div.html()).toBe('');

                ctx.value(0);
                expect($div.html()).toBe('0');
            });


            it('supports filters', function () {
                var $div = $('<div nk="html: value | tf1:\'321\'"></div>'),
                    ctx = {
                        value: Observable(123)
                    };
                ViewModel.findBinds($div, ctx);
                expect($div.html()).toBe('444');
            });
        });


        describe('.withModel', function () {
            it('draws model', function () {

                var superman = new Model({
                    name: 'Superman'
                });

                var $cont = $('<div><ul nk="withModel: hero"><li>{{name}}</li></ul></div>');
                var ctx = {
                    hero: Observable()
                };

                ViewModel.findBinds($cont, ctx);

                ctx.hero(superman);

                expect($cont.find('li').html()).toBe('Superman');

                var batman = new Model({
                    name: 'Batman'
                });

                ctx.hero(batman);

                expect($cont.find('li').html()).toBe('Batman');


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
                var calls0=0;
                window.spy0 = function () {
                    calls0++;
                    return '';
                };

                var calls1=0;
                window.spy1 = function () {
                    calls1++;
                    return '';
                };

                var calls2=0;
                window.spy2 = function () {
                    calls2++;
                    return '';
                };


                var $cont = $('<div><ul nk="eachModel: heroes; attr: {nothing: spy0()}"><li nk="attr: {nothing: spy1()}">{{name}}: <ul nk="eachModel: $self.abilities"><li nk="attr: {nothing: spy2()}">{{name}},</li></ul></li></ul></div>');

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
        });
    });


    describe('inline modificators', function () {

        describe('{{}}', function () {
            it('inserts value of observable', function () {


                var $div = $('<div>Hello{{name}}! {{value}}<div>asd</div></div>');
                var ctx = {
                    name: Observable('<span style="color: green;">Moe</span>'),
                    value: Observable('')
                };
                ViewModel.findBinds($div[0], ctx);

                expect($div.text()).toEqual('HelloMoe! asd');
                ctx.value(12);
                expect($div.text()).toEqual('HelloMoe! 12asd');


            });


            it('supports filters', function () {
                var $div = $('<div>{{value | tf1:\'321\'}}</div>'),
                    ctx = {
                        value: Observable(123)
                    };
                ViewModel.findBinds($div, ctx);
                expect($div.html()).toBe('444');
            });

            it('supports custom regex', function () {

                var ctx = {
                    name: Observable('<span style="color: green;">Moe</span>'),
                    value: Observable('')
                };

                var lastRegex = ViewModel.inlineModificators['{{}}'].regex;

                ViewModel.inlineModificators['{{}}'].regex = /\$\{([\s\S]+?)\}/g;

                var $div2 = $('<div>Hello ${name}! ${value}<div>asd</div></div>');
                ViewModel.findBinds($div2[0], ctx);
                expect($div2.text()).toBe('Hello Moe! asd');

                ViewModel.inlineModificators['{{}}'].regex = lastRegex;

            });


            it('supports empty values', function () {
                var ctx = {
                    name: Observable('<span style="color: green;">Moe</span>')
                };
                var $div3 = $('<div>{{name}}</div>');
                ViewModel.findBinds($div3[0], ctx);
                expect($div3.text()).toBe('Moe');
                ctx.name('');
                expect($div3.text()).toBe('');
                ctx.name('Moe');
                expect($div3.text()).toBe('Moe');
            });


            it('0 is not empty string', function () {
                var $div = $('<div>{{value()}}</div>'),
                    ctx = {
                        value: Observable(0)
                    };
                ViewModel.findBinds($div, ctx);


                expect($div.html()).toBe('0');

                ctx.value(null);
                expect($div.html()).toBe('');
            });

            it('supports line breaks', function () {
                var ctx = {
                    name: Observable('')
                };

                var $div3 = $('<div>\n\
        {{name}} \n\
            </div>');

                ViewModel.findBinds($div3, ctx);
                expect($.trim($div3.text())).toBe('');
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