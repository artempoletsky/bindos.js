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
                    let fnName = events[name];

                    //если это простая функция или содержится в VM
                    var fn = (typeof fnName === 'function') ? fnName : me[fnName],
                        proxy;

                    if (typeof fn !== 'function') {
                        throw TypeError(fnName + ' is not a function');
                    }
                    eventsPath = name.split(eventSplitter);
                    //меняем запятые в имени события на пробелы и неймспейс
                    eventName = eventsPath.shift().split(',').join('.' + me._cid + ' ') + '.' + me._cid;

                    proxy = fn.bind(me);

                    //fixme need vanilla implementation
                    if (eventsPath.length) {
                        me.el.on(eventName, eventsPath.join(' '), proxy);
                    } else {
                        me.el.on(eventName, proxy);
                    }
                }
                return this;
            },
            undelegateEvents: function () {
                //fixme need vanilla implementation
                //this.$el.unbind('.' + this._cid);
                return this;
            },
            render: function () {
                return this;
            }
        };
    ViewModel = Model.extend(ViewModel);

    /*
     $.fn.clearBinds = function () {
     var $self = $();
     $self.length = 1;
     this.each(function () {
     $self[0] = this;
     ObjectObservable.clearBinds($self.data('nkObservers'));
     $self.children().clearBinds();
     });
     return this;
     };

     $.fn.refreshBinds = function () {
     var $self = $();
     $self.length = 1;
     this.each(function () {
     $self[0] = this;
     ObjectObservable.refreshBinds($self.data('nkObservers'));
     $self.children().refreshBinds();
     });
     return this;
     };


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
     fn,
     addArgKey;

     for (addArgKey in addArgs) {
     keys.push(addArgKey);
     vals.push(addArgs[addArgKey]);
     }

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
     return fn.apply(context, vals);
     } catch (exception) {
     if (throwError) {
     throw exception;
     } else {
     console.log('Error "' + exception.message + '" in expression "' + string + '" Context: ', context, 'addArgs: ', addArgs);
     }

     }
     };
     };


     ViewModel.findCallAndSubscribe = function (string, context, addArgs, callback, $el) {
     var obs = this.findObservable(string, context, addArgs, $el);
     callback(obs.value);
     obs.subscribe(callback);
     return obs;
     };

     ViewModel.findObservable = function (string, context, addArgs, $el) {
     var result = {
     $el: $el
     };
     if (context && context.prop && context.attributes) {//if model
     result.model = context;
     result.prop = string;
     } else {
     result.evil = {
     string: string,
     context: context,
     addArgs: addArgs
     }
     }
     return new ObjectObservable(result);
     };
     //*/

    ViewModel.findBinds = function (element, model) {
        var newctx,
            breakContextIsSent = false,
            self = this,
            $el = $(element),
            elem = $el[0],
            tagBehavior, attrs;

        if (!elem) {
            throw new Error('Element not exists');
        }
        tagBehavior = self.tags[elem.tagName.toLowerCase()];


        if (tagBehavior) {
            tagBehavior.call(self, $el, model);
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
                newctx = attrFn.call(self, $el, value, model);
                if (newctx === false) {
                    breakContextIsSent = true;
                } else if (newctx) {
                    model = newctx;
                }
            });


        if (!breakContextIsSent) {
            $el.contents().each(function () {
                var node = this;
                if (this.nodeType == 3) {
                    _.forIn(self.inlineModificators, function (mod) {
                        mod.call(self, node, model);
                    });
                } else if (this.nodeType == 1) {
                    self.findBinds(node, model);
                }
            });

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