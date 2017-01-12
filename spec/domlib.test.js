describe('$', function () {


    it('should call ready after DOMContentLoaded', function () {
        var spyHandler = jasmine.createSpy('handler');
        $.ready(spyHandler);
        expect(spyHandler).toHaveBeenCalled();
    });
});
