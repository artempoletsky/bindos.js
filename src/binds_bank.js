(function () {
    "use strict";
    /*globals ViewModel, $, _*/
    ViewModel.binds = {
        log: function (elem, value, context, addArgs) {
            this.findObservable(context, value, addArgs).callAndSubscribe(function () {
                console.log(context, '.', value, '=', this());
            });
        },
        src: function (elem, value, context, addArgs) {
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    elem.src = val || '';
                });
        },
        html: function (elem, value, context, addArgs) {
            //var $el=$(elem);
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    //undefined конвертируется в пустую строку
                    if (!val) {
                        val = '';
                    }
                    elem.innerHTML = val;
                });
        },
        text: function (elem, value, context, addArgs) {
            var $el = $(elem);
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    $el.text(val);
                });
        },
        'with': function (elem, value, context, addArgs) {
            return this.findObservable(context, value, addArgs)();
        },
        each: function (elem, value, context, addArgs) {
            var fArray = this.findObservable(context, value, addArgs),
                $el = $(elem),
                html = $el.html();
            $el.empty();

            if (addArgs) {
                addArgs = _.clone(addArgs);
            }
            else {
                addArgs = {};
            }
            fArray.callAndSubscribe(function (array) {
                $el.empty();
                if (array) {
                    _.each(array, function (val, ind) {
                        addArgs.$index = ind;
                        addArgs.$parent = array;
                        addArgs.$value = val;
                        var tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        ViewModel.findBinds(tempDiv, val, addArgs);
                        $el.append(tempDiv.innerHTML);
                    });
                }
            });

            return false;
        },
        value: function (elem, value, context, addArgs) {
            var $el = $(elem),
                obs = this.findObservable(context, value, addArgs)
                    .callAndSubscribe(function (value) {
                        $el.val(value);
                    });
            $el.change(function () {
                obs($el.val());
            });
        },
        attr: function (elem, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function (condition, attrName) {
                ViewModel.findObservable(context, condition, addArgs)
                    .callAndSubscribe(function (val) {
                        if (val !== false && val !== undefined) {
                            elem.setAttribute(attrName, val);
                        } else {
                            elem.removeAttribute(attrName);
                        }
                    });
            });
        },
        style: function (elem, value, context, addArgs) {
            var $el = $(elem);
            _.each(this.parseOptionsObject(value), function (condition, style) {
                ViewModel.findObservable(context, condition, addArgs)
                    .callAndSubscribe(function (value) {
                        $el.css(style, value);
                    });
            });
        },
        css: function (elem, value, context, addArgs) {
            var $el = $(elem);
            _.each(this.parseOptionsObject(value), function (condition, className) {
                ViewModel.findObservable(context, condition, addArgs)
                    .callAndSubscribe(function (value) {
                        if (value) {
                            $el.addClass(className);
                        }
                        else {
                            $el.removeClass(className);
                        }
                    });
            });
        },
        display: function (elem, value, context, addArgs) {
            var $el = $(elem);
            this.findObservable(context, value, addArgs).callAndSubscribe(function (value) {
                if (value) {
                    $el.show();
                }
                else {
                    $el.hide();
                }
            });
        },
        click: function (elem, value, context, addArgs) {
            var fn = this.findObservable(context, value, addArgs)(),
                $el = $(elem);
            $el.click(function () {
                fn.apply(context, arguments);
            });
        }
    };
}());
