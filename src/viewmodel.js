(function (window) {
    "use strict";
    /*global _, Computed, Observable, Model, Events, BaseObservable */
    var $ = window.$,
        eventSplitter = /\s+/,
        bindSplitter = /\s*;\s*/,
        simpleTagRegex = /^[a-z]+$/,
        firstColonRegex = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*$/,
        breakersRegex = /^\{([\s\S]*)\}$/,
        commaSplitter = /\s*,\s*/,
        ViewModel = {
            setElement: function (el) {
                this.undelegateEvents();
                this.el = el;
                this.$el = $(el);
                this.parse().delegateEvents();
                return this;
            },
            constructor: function (options) {
                options = options || {};
                this.options = options;
                if (options.collection) {
                    this.collection = options.collection;
                }
                this.model = options.model;
                if (options.el) {
                    this.el = options.el;
                }

                var me = this;
                if (!me._cid) {
                    me._cid = _.uniqueId('vm');
                }
                if (!me.el) {
                    me.el = 'div';
                }

                if (typeof me.el === 'string') {
                    if (simpleTagRegex.test(me.el) && me.el !== 'html' && me.el !== 'body') {
                        me.el = document.createElement(me.el);
                    } else {
                        me.el = $(me.el)[0];
                    }

                }
                me.$el = $(me.el);
                me.$ = function (selector) {
                    return me.$el.find(selector);
                };
                me.initialize();

                if (me.autoParseBinds) {
                    me.parse();
                }

                me.delegateEvents();
            },
            remove: function () {
                this.$el.remove();
                return this;
            },
            parse: function () {
                ViewModel.findBinds(this.el, this);
                return this;
            },
            /**
             *
             * @param json
             * @returns {Observable}
             * @deprecated использовать binds.withModel
             */
            bindToModel: function (json) {
                var oModel = Observable(new Model(json)),
                    model = oModel(),
                    ctx = {},
                    me = this;

                oModel.callAndSubscribe(function (newModel) {
                    if (model) {
                        model.off(0, 0, ctx);
                    }
                    model = newModel;
                    if (newModel) {
                        newModel.on('change', function (changed) {
                            _.each(changed, function (val, key) {
                                if (me[key]) {
                                    me[key].fire();
                                }
                            });

                        }, ctx);
                    }
                });

                if (!this._bindedToModel) {
                    _.each(model.attributes, function (value, prop) {
                        me[prop] = Computed(function () {

                            var mod = oModel();
                            if (!mod) {
                                return '';
                            }
                            return mod.prop(prop);

                        });
                    });
                }
                this._bindedToModel = true;
                return oModel;
            },
            autoParseBinds: false,
            initialize: function () {
            },
            delegateEvents: function (events) {
                events = events || this.events;
                this.undelegateEvents();
                var eventsPath, eventName, me = this;
                _.each(events, function (fnName, name) {
                    //если это простая функция или содержится в VM
                    var fn = (typeof fnName === 'function') ? fnName : me[fnName],
                        proxy;

                    if (typeof fn !== 'function') {
                        throw TypeError(fnName + ' is not a function');
                    }
                    eventsPath = name.split(eventSplitter);
                    //меняем запятые в имени события на пробелы и неймспейс
                    eventName = eventsPath.shift().split(',').join('.' + me._cid + ' ') + '.' + me._cid;

                    proxy = _.bind(fn, me);

                    if (eventsPath.length) {
                        me.$el.delegate(eventsPath.join(' '), eventName, proxy);
                    } else {
                        me.$el.bind(eventName, proxy);
                    }
                });
                return this;
            },
            undelegateEvents: function () {
                this.$el.unbind('.' + this._cid);
                return this;
            },
            render: function () {
                return this;
            }
        };
    ViewModel = Events.extend(ViewModel);

    ViewModel.compAsync = true;

    ViewModel.findObservable = function (context, string, addArgs) {

        addArgs = addArgs || {};
        if (typeof string !== 'string') {
            throw  new TypeError('String expected');
        }
        if (Observable.isObservable(context)) {
            context = context();
        }
        var keys = [],
            vals = [],
            fn,
            comp,
            fnEval,
            obs;
        _.each(addArgs, function (val, key) {
            keys.push(key);
            vals.push(val);
        });

        keys.push('with(this) return ' + string);
        fn = Function.apply(context, keys);
        fnEval = function () {
            try {
                return fn.apply(context, vals);
            } catch (exception) {
                console.log('Error "' + exception.message + '" in expression "' + string + '" Context: ', context);
            }
        };

        obs = fnEval();
        //если уже асинхронный, то возвращаем его
        if (this.compAsync) {
            if (!Observable.isObservable(obs)) {
                obs = fnEval;
            }
            comp = BaseObservable({
                async: true,
                get: function () {
                    return  obs();
                },
                set: function (val) {
                    obs(val);
                }
            });
        } else {

            if (Observable.isObservable(obs)) {
                comp = obs;
            } else {
                comp = Computed(function () {
                    return fnEval();
                }, context);
            }
        }
        return comp;
    };

    ViewModel.findBinds = function (element, context, addArgs) {
        var curBindsString, binds, i, j, k, newctx, l, cBind, ccBind, bindName, bindVal, bindFn, arr,
            breakContextIsSent = false,
            self = this,
            $el = $(element);
        curBindsString = $el.attr('data-bind');
        $el.removeAttr('data-bind');

        if (curBindsString) {
            binds = curBindsString.split(bindSplitter);
            for (i = 0, l = binds.length; i < l; i++) {

                cBind = binds[i];

                arr = cBind.match(firstColonRegex);

                if (!arr) {
                    bindName = cBind;
                    bindVal = '';
                } else {
                    bindName = arr[1];
                    bindVal = arr[2];
                }

                bindName = bindName.split(commaSplitter);

                for (j = 0, k = bindName.length; j < k; j++) {
                    ccBind = bindName[j];
                    //если бинд не пустой и не закомментирован с помощью !
                    if (ccBind && ccBind.charAt(0) !== '!') {
                        bindFn = ViewModel.binds[ccBind];

                        if (bindFn) {
                            newctx = bindFn.call(self, element, bindVal, context, addArgs);
                            if (newctx === false) {
                                breakContextIsSent = true;
                            } else if (newctx) {
                                context = newctx;
                            }
                        } else {
                            console.warn('Bind: "' + ccBind + '" not exists');
                        }
                    }
                }
            }
        }
        if (!breakContextIsSent) {
            $el.children().each(function () {
                self.findBinds(this, context, addArgs);
            });
        }
    };

    ViewModel.parseOptionsObject = function (value) {
        var match, attrs, res;
        if (!value) {
            return {};
        }

        match = value.match(breakersRegex);
        if (!match || match[1] === undefined) {
            throw new Error('Expression: "' + value + '" is not valid object');
        }

        attrs = match[1].split(commaSplitter);
        if (!attrs.length) {
            return {};
        }

        res = {};
        _.each(attrs, function (val) {

            if (!val) {
                return;
            }
            match = val.match(firstColonRegex);

            if (!match || !match[1] || !match[2]) {
                throw new Error('Expression: "' + value + '" is not valid object');
            }
            res[match[1]] = match[2];
        });
        return res;
    };

    window.ViewModel = ViewModel;
}(this));