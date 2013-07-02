(function (window) {
    "use strict";
    /*global _, Computed, Observable, Model, Events, BaseObservable */
    var $ = window.$,
        eventSplitter = /\s+/,

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

    ViewModel.evil = function (string, context, addArgs, throwError) {
        addArgs = addArgs || {};
        if (typeof string !== 'string') {
            throw  new TypeError('String expected in evil function');
        }
        string = string.replace(/\n/g, '\\n');
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
                        return fn.call(context, context);
                    case 2:
                        return fn.call(context, context, vals[1]);
                    case 3:
                        return fn.call(context, context, vals[1], vals[2]);
                    case 4:
                        return fn.call(context, context, vals[1], vals[2], vals[3]);
                    case 5:
                        return fn.call(context, context, vals[1], vals[2], vals[3], vals[4]);
                    case 6:
                        return fn.call(context, context, vals[1], vals[2], vals[3], vals[4], vals[5]);
                    default:
                        return fn.apply(context, vals);
                }

            } catch (exception) {
                if (throwError) {
                    throw exception;
                } else {
                    console.log('Error "' + exception.message + '" in expression "' + string + '" Context: ', context);
                }

            }
        };
    };
    ViewModel.findObservable = function (string, context, addArgs) {

        var evil = ViewModel.evil(string, context, addArgs),
            obs = evil();

        if (Observable.isObservable(obs)) {
            return obs;
        }

        return Computed(evil, context);

    };

    ViewModel.findBinds = function (selector, context, addArgs) {
        var newctx,
            breakContextIsSent = false,
            self = this,
            $el = $(selector),
            elem = $el[0],
            tagBehavior, attrs;

        if (!elem) {
            throw new Error('Element not exists');
        }
        tagBehavior = self.tags[elem.tagName.toLowerCase()];


        if (tagBehavior) {
            tagBehavior.call(self, $el, context, addArgs);
            return;
        }


        _.forIn(_.foldl(elem.attributes, function (result, attr) {
            result[attr.nodeName] = attr.nodeValue;
            return result;
        }, {}),
            function (value, name) {
                var attrFn = self.customAttributes[name];
                if (!attrFn) {
                    return;
                }
                newctx = attrFn.call(self, $el, value, context, addArgs);
                if (newctx === false) {
                    breakContextIsSent = true;
                } else if (newctx) {
                    context = newctx;
                }
            });


        if (!breakContextIsSent) {
            $el.contents().each(function () {
                var node = this;
                if (this.nodeType == 3) {
                    _.forIn(self.inlineModificators, function (mod) {
                        mod.call(self, node, context, addArgs);
                    });
                } else if (this.nodeType == 1) {
                    self.findBinds(node, context, addArgs);
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