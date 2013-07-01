/*globals describe, jasmine, expect, $, _, it, ViewModel, Observable*/
describe('ViewModel.binds', function () {
    "use strict";

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

        });
    });


    describe('inline modificators', function () {

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

    });


});