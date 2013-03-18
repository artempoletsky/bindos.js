(function () {
    "use strict";
    /*globals $, ViewModel, Observable*/
    $(function () {
        var $html = $('html'),
            initialBind = $html.attr('data-bind');

        if (initialBind && initialBind.indexOf('app') !== -1) {
            window.app = ViewModel.create({
                el: $html[0],
                autoParseBinds: true
            });
        }
    });

    ViewModel.binds.app = function (html, value) {

    };
    var bracketRegEx = /(\w+)\s*\(([^)]*)\)/;
    //y_our1Name ('Name')
    ViewModel.binds.observer = function (elem, value, context, addArgs) {
        var matches = bracketRegEx.exec(value),
            name,
            val;

        if (matches) {
            name = matches[1];
            val = this.findObservable(context, matches[2], addArgs)();
        }
        else {
            name = value;
            val = undefined;
        }
        context[name] = Observable(val);
    };

    ViewModel.binds.keyUpChange = function (elem, value, context, addArgs) {
        var $el = $(elem),
            observer = this.findObservable(context, value, addArgs).callAndSubscribe(function (value) {
                $el.val(value);
            });
        $el.keyup(function () {
            observer($el.val());
        });
    };

}());

