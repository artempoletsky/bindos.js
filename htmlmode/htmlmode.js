(function () {
    "use strict";
    /*globals $, ViewModel, Observable, Model, Collection, _*/
    window.app = new ViewModel();
    $(function () {
        var $html = $('html'),
            initialBind = $html.attr('data-bind');

        if (initialBind && initialBind.indexOf('app') !== -1) {
            window.app.setElement($html[0]).parse();
        }
    });

    ViewModel.binds.app = function (htmlEl, value) {

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
    ViewModel.binds.checked = function (checkbox, value, context, addArgs) {
        var $el = $(checkbox),
            obs = this.findObservable(context, value, addArgs).callAndSubscribe(function (val) {
                $el.prop('checked', val);
            });
        $el.on('change', function () {
            obs($el.prop('checked'));
        });
    };

    ViewModel.binds.model = function (elem, value, context, addArgs) {
        context[value] = Model.extend({
            defaults: JSON.parse($(elem).html())
        });
        return false;
    };


    ViewModel.binds.collection = function (elem, value, context, addArgs) {
        var args = value.split(/\s*,\s*/);
        context[args[0]] = Collection.create({
            model: this.findObservable(context, args[1], addArgs)()
        }, JSON.parse($(elem).html()));
    };

    ViewModel.binds.form = function (form, value, context, addArgs) {
        var $form = $(form),
            args = this.parseOptionsObject(value),
            ModelClass = this.findObservable(context, args.model, addArgs)(),
            submit = this.parseOptionsObject(args.submit),
            directives = this.binds.form.directives;
        form.reset();
        $form.submit(function () {
            var model, attrs = {};
            _.each($form.serializeArray(), function (obj) {
                attrs[obj.name] = obj.value;
            });

            model = new ModelClass(attrs);
            _.each(submit, function (args, directive) {
                directives[directive].call(ViewModel, model, args, context, addArgs);
            });
            return false;
        });
        return false;
    };
    ViewModel.binds.form.directives = {
        add: function (model, value, context, addArgs) {
            var args = value.split(/\s*\|\s*/),
                collection = this.findObservable(context, args.shift(), addArgs)(),
                self = this;
            args = _.map(args, function (value) {
                return self.findObservable(context, value, addArgs)();
            });
            args.unshift(model);

            collection.add.apply(collection, args);
        }
    };

}());

