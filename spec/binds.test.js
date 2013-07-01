/*globals describe, jasmine, expect, $, _, it, ViewModel, Observable*/
describe('ViewModel.binds', function () {
    "use strict";


    describe('filters', function () {


        var filter = ViewModel.filters.tf1 = {
            out: function (value, option) {
                return value * 1 + option * 1;
            },
            in: function (value, option) {
                return value * 1 - option * 1;
            }
        };

        var filter2 = ViewModel.filters.tf2 = {
            out: function (value, option) {
                return 1 * value * value;
            },
            in: function (value, option) {
                return Math.sqrt(1 * value);
            }
        };


        it('can create reusable filter', function () {


            expect(filter.out(123, '2')).toBe(125);
            expect(filter.in('125', '2')).toBe(123);
            expect(filter2.out(2)).toBe(4);
            expect(filter2.in('4')).toBe(2);

        });


        it('can create filtered computed', function () {
            expect(ViewModel.filters.tf1).toBeDefined();
            expect(ViewModel.filters.tf2).toBeDefined();
            var ctx = {
                value: Observable(5)
            };
            var filtComp = ViewModel.applyFilters('value | tf1:\'13\' | tf2', ctx);
            expect(filtComp()).toBe(18 * 18);

            filtComp(4 * 4);
            expect(ctx.value()).toBe(4 - 13);

            filtComp(18 * 18);
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
                expect($div.html()).toBe('<span>Hello</span>');

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


});