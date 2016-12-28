(function (window) {
    "use strict";


    var $ = window.$,
        eventSplitter = /\s+/,

        simpleTagRegex = /^[a-z]+$/,
        firstColonRegex = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*$/,
        //breakersRegex = /^\{([\s\S]*)\}$/,
        parsePairs,
        commaSplitter = /\s*,\s*/,

        ViewModel = {
            shortcuts: {},
            setElement: function (el) {
                this.undelegateEvents();
                this.el = el;
                this.parseBinds().delegateEvents();
                return this;
            },
            wrapReady: false,
            $: function (selector) {
                return this.el.querySelector(selector);
            },
            $$: function (selector) {
                return this.el.querySelectorAll(selector);
            },
            constructor: function (options) {
                options = options || {};

                var me = this;


                me.options = options;
                me._delegatedEvents = [];
                if (options.collection) {
                    me.collection = options.collection;
                }
                me.model = options.model;
                if (options.el) {
                    me.el = options.el;
                }


                if (!me._cid) {
                    me._cid = $.uniqueId('vm');
                }
                if (!me.el) {
                    me.el = 'div';
                }


                me._super();


                var ctor = function () {
                    if (typeof me.el === 'string') {
                        if (simpleTagRegex.test(me.el) && me.el !== 'html' && me.el !== 'body') {
                            me.el = document.createElement(me.el);
                        } else {
                            me.el = $(me.el);
                        }
                    }

                    for (let name in me.shortcuts) {
                        me[name] = me.$(me.shortcuts[name]);
                    }


                    if (me.autoParseBinds) {
                        me.parseBinds();
                    }

                    me.delegateEvents();

                    me.initialize();
                };

                if (me.wrapReady) {
                    $.ready(ctor);
                } else {
                    ctor();
                }

            },
            remove: function () {
                this.$el.remove();
                return this;
            },
            parseBinds: function () {
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
                for (let name in events) {
                    let fnName = events[name], fn, proxy;

                    if (typeof fnName === 'function') {
                        fn = fnName;
                        proxy = function (event, delegate) {
                            fn(me, event, delegate);
                        };
                    } else {
                        fn = me[fnName];
                        proxy = fn.bind(me);
                    }

                    if (typeof fn !== 'function') {
                        throw TypeError(fnName + ' is not a function');
                    }
                    eventsPath = name.split(eventSplitter);
                    eventName = eventsPath.shift().replace(',', ' ');


                    me._delegatedEvents = me._delegatedEvents.concat(
                        me.el.on(
                            eventName,
                            proxy,
                            eventsPath.length ?
                                eventsPath.join(' ') : false
                        )
                    );

                }
                return this;
            },
            undelegateEvents() {
                let args;
                while (args = this._delegatedEvents.pop()) {
                    this.el.off(args[0], args[1]);
                }
                return this;
            },
            render: function () {
                return this;
            }
        };
    ViewModel = Model.extend(ViewModel);


    ViewModel.findBinds = function (elem, model) {
        var
            breakContextIsSent = false,
            self = this;

        if (typeof elem == 'string') {
            elem = $(elem);
        }
        if (!elem) {
            throw new Error('Element not exists');
        }

        for (let selector in ViewModel.bindSelectors) {
            let fn = ViewModel.bindSelectors[selector];
            let elements = Array.from(elem.$$(selector));
            if (elem.matches(selector)) {
                elements.unshift(elem);
            }
            for (let el of elements) {
                let newctx = fn.call(self, el, model);
                if (newctx === false) {
                    breakContextIsSent = true;
                    break;
                } else if (newctx) {
                    model = newctx;
                }
            }
            if (breakContextIsSent) {
                break;
            }
        }
    };

    /*var anotherBreakersRegEx = /\{[\s\S]*\}/;
     var firstColonRegex2 = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*,/;*/
    parsePairs = function (string) {
        var result = {};
        string.split(commaSplitter).forEach(function (value) {
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

        for (let key in parsedSimpleObjects) {
            let object = parsedSimpleObjects[key];
            for (let key2 in object) {
                let value = object[key2];
                if (parsedSimpleObjects[value]) {
                    object[key2] = parsedSimpleObjects[value];
                    delete parsedSimpleObjects[value];
                }
            }
        }
        for (let key in parsedSimpleObjects) {
            result = parsedSimpleObjects[key];
        }

        if (!result) {
            throw new Error(value + ' is not valid options object');
        }
        return result;
    };

    window.ViewModel = ViewModel;
}(this));