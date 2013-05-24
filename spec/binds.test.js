/*globals describe, jasmine, expect, $, _, it, ViewModel, Observable*/
describe('ViewModel.binds', function () {
    "use strict";

    describe('.html', function () {

        it('replaces innerHTML of HTMLElement the value of the concerned observable', function () {
            var $div=$('<div nk="html: value"></div>'),
                ctx= {
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