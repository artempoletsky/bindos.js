describe('$', function () {


    it('ready', function () {
        var spyHandler = jasmine.createSpy('handler');
        bindos.$.ready(spyHandler);
        expect(spyHandler).toHaveBeenCalled();
    });

    it('findParent', function () {
        let dom = $.parse('<div class="c1"><div class="c2"><div class="c3"></div></div></div>');
        document.body.appendChild(dom);
        let c3 = dom.$('.c3');
        expect(c3.findParent('.c4')).toBeUndefined();
        expect(c3.findParent('.c1')).toBe(dom);
        expect(c3.findParent('.c2')).toBe(dom.$('.c2'));
        expect(c3.findParent('.c3')).toBe(c3);

        document.body.removeChild(dom);
    });
});
