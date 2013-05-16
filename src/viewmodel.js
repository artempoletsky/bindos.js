(function (window) {
    "use strict";
    /*global _, Computed, Observable, Model, Events, BaseObservable */
    var $ = window.$,
        eventSplitter = /\s+/,
        bindSplitter = /\s*;\s*/,
        simpleTagRegex = /^[a-z]+$/,
        firstColonRegex = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*$/,
    //breakersRegex = /^\{([\s\S]*)\}$/,
        parsePairs,
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

    ViewModel.evil = function (context, string, addArgs) {
        addArgs = addArgs || {};
        if (typeof string !== 'string') {
            throw  new TypeError('String expected');
        }
        if (Observable.isObservable(context)) {
            context = context();
        }
        var contextName = 'context' + Math.floor(Math.random() * 10000000),
            keys = [contextName],
            vals = [],
            fn;
        _.each(addArgs, function (val, key) {
            keys.push(key);
            vals.push(val);
        });

        if (context) {
            keys.push('with(' + contextName + ') return ' + string);
        }
        else {
            keys.push('return ' + string);
        }
        fn = Function.apply(context, keys);
        vals.unshift(context);
        return function () {
            try {
                switch (vals.length) {
                    case 1:
                        return fn(context);
                    case 2:
                        return fn(context, vals[1]);
                    case 3:
                        return fn(context, vals[1], vals[2]);
                    case 4:
                        return fn(context, vals[1], vals[2], vals[3]);
                    case 5:
                        return fn(context, vals[1], vals[2], vals[3], vals[4]);
                    case 6:
                        return fn(context, vals[1], vals[2], vals[3], vals[4], vals[5]);
                    default:
                        return fn.apply(undefined, vals);
                }

            } catch (exception) {
                console.log('Error "' + exception.message + '" in expression "' + string + '" Context: ', context);
            }
        };
    };
    ViewModel.findObservable = function (context, string, addArgs) {

        var evil = ViewModel.evil(context, string, addArgs),
            obs = evil();

        if (Observable.isObservable(obs)) {
            return obs;
        }

        return Computed(function () {
            return evil();
        }, context);

    };

    ViewModel.findBinds = function (element, context, addArgs) {
        var curBindsString, binds, newctx, bindName, bindVal, bindFn, arr,
            breakContextIsSent = false,
            self = this,
            $el = $(element);
        curBindsString = $el.attr('data-bind');
        $el.removeAttr('data-bind');

        if (curBindsString) {
            binds = curBindsString.split(bindSplitter);
            _.each(binds, function (cBind) {


                arr = cBind.match(firstColonRegex);

                if (!arr) {
                    bindName = cBind;
                    bindVal = '';
                } else {
                    bindName = arr[1];
                    bindVal = arr[2];
                }

                bindName = bindName.split(commaSplitter);
                _.each(bindName, function (ccBind) {
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
                });
            });

        }
        if (!breakContextIsSent) {
            $el.contents().each(function () {
                var el = this;
                if (this.nodeType == 3) {
                    _.forOwn(self.inlineModificators, function (mod) {
                        mod.call(this, el, context, addArgs);
                    });
                } else {
                    self.findBinds(el, context, addArgs);
                }
            });

        }
    };

    /*var anotherBreakersRegEx = /\{[\s\S]*\}/;
     var firstColonRegex2 = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*,/;*/
    parsePairs = function (string) {
        var result = {};
        _.each(string.split(commaSplitter), function (value) {
            var matches = firstColonRegex.exec(value);
            if (matches) {
                result[matches[1]] = matches[2];
            }
        });
        return result;
    };

    ViewModel.parseOptionsObject = function (value) {
        var parsedSimpleObjects = {},
            result,
            i = 0,
            recursiveParse = function (string) {
                if (string.match(/\{[^{}]*\}/)) {
                    recursiveParse(string.replace(/\{[^{}]*\}/, function (string) {

                        var name = Math.random() + i++;
                        parsedSimpleObjects[name] = parsePairs(string.slice(1, -1));
                        return name;
                    }));
                }
            };
        recursiveParse(value);

        _.each(parsedSimpleObjects, function (object) {
            _.each(object, function (value, key) {
                if (parsedSimpleObjects[value]) {
                    object[key] = parsedSimpleObjects[value];
                    delete parsedSimpleObjects[value];
                }
            });
        });

        _.each(parsedSimpleObjects, function (value) {
            result = value;
        });
        if (!result) {
            throw new Error(value + ' is not valid options object');
        }
        return result;
    };

    window.ViewModel = ViewModel;
}(this));