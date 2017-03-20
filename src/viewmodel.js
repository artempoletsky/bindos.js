(function () {
    "use strict";


    var $ = window.$,
        Model = bindos.Model,
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
            template: undefined,
            wrapReady: false,
            warnIfElementNotExists: true,
            $: function (selector) {
                return this.el.querySelector(selector);
            },
            $$: function (selector) {
                return this.el.querySelectorAll(selector);
            },
            setModel(model) {
                this.prop(model.attributes);
            },
            constructor: function (options) {
                options = options || {};

                var me = this;


                me.options = options;
                me._delegatedEvents = [];



                //console.log(me.model.fields);
                if (options.el) {
                    me.el = options.el;
                }


                if (!me._cid) {
                    me._cid = $.uniqueId('vm');
                }
                if (!me.el) {
                    me.el = 'div';
                }

                if(me.template) {
                    let template = ViewModel.templates[me.template];
                    if(!template){
                        throw new Error(`Template ${me.template} is not defined`);
                    }
                    me.el = template.cloneNode(true);
                }


                me._super();

                if (options.model) {
                    me.setModel(options.model);
                }

                var ctor = function () {
                    let elSelector = me.el;
                    if (typeof elSelector === 'string') {
                        if (simpleTagRegex.test(elSelector) && elSelector !== 'html' && elSelector !== 'body') {
                            me.el = document.createElement(elSelector);
                        } else {
                            me.el = bindos.$(elSelector);
                        }
                    }
                    if (!me.el) {
                        if (me.warnIfElementNotExists) {
                            console.warn('Element ' + elSelector + ' not exists. ViewModel: ', me);
                        }
                        return;
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
                    bindos.$.ready(ctor);
                } else {
                    ctor();
                }

            },
            parseBinds: function () {
                ViewModel.findBinds(this.el, this);
                return this;
            },
            autoParseBinds: false,
            initialize: function () {},
            listItem: undefined,
            delegateEvents: function (events) {
                events = events || this.events;
                this.undelegateEvents();
                var eventsPath, eventName, me = this;
                for (let name in events) {
                    let fnName = events[name],
                        fn, proxy;

                    let useSelfMethod = typeof fnName !== 'function'

                    fn = useSelfMethod ? me[fnName] : fnName;

                    if (typeof fn !== 'function') {
                        throw TypeError(fnName + ' is not a function, but ' + (typeof fn));
                    }

                    proxy = function (event, delegate) {

                        let args = [me, event, delegate];
                        let l = fn.length,
                            listItem, index, model;

                        if (useSelfMethod) {
                            l += 1;
                        }

                        if (l > 3) {
                            listItem = delegate.findParent(me.listItem);
                            args.push(listItem)
                        }
                        if (l > 4) {
                            index = listItem.index();
                            args.push(index);
                        }
                        if (l > 5) {
                            model = me.collection.at(index);
                            args.push(model);
                        }


                        if (useSelfMethod) {
                            args.shift();
                        }

                        fn.apply(me, args);
                    };

                    eventsPath = name.split(eventSplitter);
                    eventName = eventsPath.shift().replace(/,/g, ' ');


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


    ViewModel.extend = function (proto) {
        if(proto.modelClass){
            let modelProto = proto.modelClass.prototype;
            if(modelProto.fields){
                if (!proto.fields) {
                    proto.fields= {};
                }
                $.defaults(proto.fields, modelProto.fields);
            }

            //console.log(modelProto.computeds);
            if(modelProto.computeds){
                if (!proto.computeds) {
                    proto.computeds= {};
                }
                $.defaults(proto.computeds, modelProto.computeds);
            }
        }
        return Model.extend.call(this, proto);
    };

    ViewModel.findBinds = function (elem, model) {

        if (typeof elem == 'string') {
            elem = bindos.$(elem);
        }
        if (!elem) {
            throw new Error('Element not exists');
        }

        let context = model;
        for (let selector in ViewModel.bindSelectors) {
            let fn = ViewModel.bindSelectors[selector];

            if (elem.matches(selector)) {
                context = fn(elem, model);
                if (context === false) {
                    return;
                }
                if (!context) {
                    context = model;
                }
            }
        }
        Array.from(elem.children).forEach((el) => ViewModel.findBinds(el, context));
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

    ViewModel.templates = {};

    bindos.ViewModel = ViewModel;
    bindos.Widget = ViewModel.extend({
        autoParseBinds: true,
        wrapReady: true
    });
}());
