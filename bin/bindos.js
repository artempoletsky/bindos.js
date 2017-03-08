(function () {

    var bindos = window.bindos = {
        extract() {
            let classes = ['Class', 'EventDispatcher', 'Model', 'Collection', 'ViewModel', 'Widget'];
            for (let className of classes) {
                window[className] = bindos[className];
            }
        }
    };

    var $ = window.$;
    var $$ = window.$$;
    var hasNoDomlib = !$;

    bindos.hasJquery = !!window.jQuery;

    bindos.$ = document.querySelector.bind(document);
    bindos.$$ = document.querySelectorAll.bind(document);

    if (hasNoDomlib) {
        $ = window.$ = bindos.$;
        $$ = window.$$ = bindos.$$;
    }


    bindos.$.extend = function (o1, ...objects) {
        for (let obj of objects) {
            for (let key in obj) {
                o1[key] = obj[key];
            }
        }
        return o1;
    };

    const eventSplitter = /\s+/;


    bindos.$.extend(Element.prototype, {
        findParent(selector) {
            var el = this;
            while (el && el.matches) {
                if (el.matches(selector)) {
                    return el;
                }
                el = el.parentNode;
            }
        },
        empty() {
            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }
        },
        index() {
            return Array.from(this.parentNode.children).indexOf(this);
        },
        on(event, callback, delegate) {
            let self = this;
            let off = [];

            event.split(eventSplitter).forEach((event) => {

                if (!delegate) {
                    self.addEventListener(event, callback);
                    off.push([event, callback]);
                    return;
                }

                let cb = function (e) {
                    let currentTarget = e.target;
                    while (currentTarget != self) {
                        if (currentTarget.matches(delegate)) {
                            e.delegate = currentTarget;
                            callback.call(self, e, currentTarget);
                            break;
                        }
                        currentTarget = currentTarget.parentNode;
                    }
                };
                self.addEventListener(event, cb);
                off.push([event, cb]);
            });
            return off;
        },
        off(event, callback) {
            let self = this;
            event.split(eventSplitter).forEach((event) => {
                self.removeEventListener(event, callback);
            });
        },
        fire(eventName, data = {
            bubbles: true,
            cancelable: true,
            view: window
        }) {
            let event = new Event(eventName, data);
            this.dispatchEvent(event);
            return this;
        },
        $: HTMLElement.prototype.querySelector,
        $$: HTMLElement.prototype.querySelectorAll,
        switchClassTo(className) {
            var cur = $('.' + className);
            if (cur) {
                cur.classList.remove(className);
            }
            this.classList.add(className);
            return this;
        }
    });


    let uniq = {};

    let isReady = false;
    let readyCallbacks = [];
    document.addEventListener('DOMContentLoaded', () => {
        isReady = true;
        readyCallbacks.forEach((cb) => cb());
        readyCallbacks = undefined;
    });

    bindos.$.extend(bindos.$, {
        ready(cb) {
            if (isReady) {
                cb();
            } else {
                readyCallbacks.push(cb);
            }
        },
    });


    bindos.$.extend($, {
        forIn(object, callback, context) {
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    callback.call(context, object[key], key, object);
                }
            }
        },
        parse(html, returnTextNodes) {
            let div = $.make('div');
            div.innerHTML = html;
            let result;
            if (returnTextNodes) {
                result = div.childNodes;
            } else {
                result = div.children;
            }
            if (result.length == 1) {
                return result[0];
            } else if (result.length == 0) {
                return undefined;
            }
            return result;
        },
        mapValues(object, iterator, context) {
            let result = {};
            for (let key in object) {
                if (object.hasOwnProperty(key)) {
                    result[key] = iterator.call(context, object[key], key, object);
                }
            }
            return result;
        },
        uniqueId(prefix) {
            if (!uniq[prefix]) {
                uniq[prefix] = 0;
            }
            return prefix + (uniq[prefix]++);
        },
        whileAsync(cond, callback, ready) {
            if (typeof ready != "function") {
                throw 'Ready callback is undefiend';
            }
            if (cond()) {
                callback(function () {
                    $.whileAsync(cond, callback, ready);
                });
            } else {
                ready();
            }
        },
        defaults(o1, o2) {
            for (let key in o2) {
                if (!(key in o1)) {
                    o1[key] = o2[key];
                }
            }
            return o1;
        },
        make: document.createElement.bind(document)
    });

    if (hasNoDomlib) {


        $.extend($, {

            ajax(options) {
                var xhr = new XMLHttpRequest();

                if (!options.method) options.method = 'GET';
                if (options.async === undefined) options.async = true;

                let urlParams = '';
                let formData;

                if (options.data) {
                    if (options.method == 'POST') {
                        formData = new FormData();
                        for (let key in options.data) {
                            let value = options.data[key];
                            formData.append(key, value);
                        }
                    } else {
                        urlParams = '?';
                        for (let key in options.data) {
                            let value = options.data[key];
                            urlParams += key + '=' + encodeURIComponent(value) + '&';
                        }
                        urlParams = urlParams.slice(0, -1);
                    }
                }

                xhr.open(options.method, options.url + urlParams, options.async);
                for (let key in options.headers) {
                    xhr.setRequestHeader(key, options.headers[key]);
                }

                var promise;
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        var data = '';
                        if (xhr.responseText) {
                            try {
                                data = JSON.parse(xhr.responseText);
                            } catch (e) {

                            }
                        }

                        if (promise) {
                            promise(data);
                        }
                        if (options.success) {
                            options.success(data);
                        }
                    }
                };




                xhr.send(formData);


                return {
                    then: function (success) {
                        promise = success;
                    }
                }
            }
        });
    }

}(this));

(function () {
    "use strict";
    let ctor = function () {
        },
        Class = function () {

        },
        fnTest = /xyz/.test(function () {
            alert('xyz');
        }) ? /\b_super\b/ : /.*/;
    Class.prototype._constructor = Object;
    Class.prototype.constructor = Class;
    Class.extend = function (props) {
        if (typeof props == 'function') {
            props = {
                constructor: props
            };
        }
        let ParentClass = this,
            Constructor = function () {
                this._constructor.apply(this, arguments);
            };
        if (props.hasOwnProperty('constructor')) {
            props._constructor = props.constructor;
        }

        ctor.prototype = ParentClass.prototype;
        Constructor.prototype = new ctor();
        //_.extend(Constructor.prototype,props);

        for (let key in props) {
            if (props.hasOwnProperty(key)) {
                let val = props[key];
                Constructor.prototype[key] =
                    //если функция
                    typeof val === 'function' &&
                    //не Observable и не конструктор
                    val._notSimple === undefined &&
                    //и содержит _super
                    fnTest.test(val.toString())
                        ? function (key) {
                            return function () {
                                var oldSuper = this._super, result;
                                this._super = ParentClass.prototype[key];
                                result = val.apply(this, arguments);
                                this._super = oldSuper;
                                return result;
                            }
                        }(key) : val;
            }
        }

        Constructor.prototype.constructor = Constructor;
        Constructor._notSimple = true;
        Constructor.extend = ParentClass.extend;
        Constructor.create = ParentClass.create;
        return Constructor;

    };


    Class.create = function (proto) {
        var args = Array.from(arguments),
            child = this.extend(proto),
            fnBody = 'return new child(',
            keys = ['child'],
            vals = [child],
            len,
            i,
            instance;
        args.shift();


        len = args.length;

        if (len > 0) {
            for (i = 0; i < len; i++) {
                fnBody += 'arg' + i + ', ';
                keys.push('arg' + i);
                vals.push(args[i]);
            }
            fnBody = fnBody.substr(0, fnBody.length - 2);
        }
        fnBody += ');';
        keys.push(fnBody);

        try {
            instance = Function.apply(undefined, keys).apply(undefined, vals);
        } catch (exception) {
            throw exception;
        }

        return instance;
    };
    bindos.Class = Class;
}());

(function () {
    "use strict";

    const eventSplitter = /\s+/,
        namespaceSplitter = '.',


        makeBind = (event, fn, context, isSignal) => {
            let arr = event.split(namespaceSplitter);
            return {
                c: context,
                s: isSignal,
                fn: fn,
                n: arr[0],//name
                ns: arr.slice(1)//namespace array
            };
        },


        compare = function (request, target) {
            let compared = (!request.fn || request.fn === target.fn)
                && (!request.n || request.n === target.n)
                && (!request.c || request.c === target.c), ns2;
            //сравнивает пространсва имен
            if (compared && request.ns.length) {
                ns2 = target.ns;
                compared = !request.ns.some(function (val) {
                    return ns2.indexOf(val);
                });
            }
            return compared;
        },


        findBinds = function (binds, event, fn, context, mode) {
            let result = mode === 'any' ? false : [],
                bind = makeBind(event, fn, context),
                bindsArray,
                l,
                i, bindObject, compared, ns2;
            if (!mode) {
                mode = 'filter';
            }
            if (!binds[bind.n]) {
                return result;
            }

            bindsArray = binds[bind.n];

            for (i = 0, l = bindsArray.length; i < l; i++) {
                bindObject = bindsArray[i];

                if (compare(bind, bindObject)) {
                    if (mode === 'filter') {
                        result.push(bindObject);
                    } else if (mode === 'any') {
                        result = true;
                        break;
                    }
                }
            }

            return result;
        },

        remove = function (me, event, fn, context) {
            let bind, i, l, listeners = {}, key, binds;
            if (!me._listeners) {
                return;
            }
            if (!event && !fn && !context) {
                delete me._listeners;
                return;
            }

            bind = makeBind(event, fn, context);

            if (!bind.ns.length && !fn && !context) {
                delete me._listeners[bind.n];
                return;
            }

            if (bind.n && !me._listeners[bind.n]) {
                return;
            }

            if (bind.n) {
                listeners[bind.n] = me._listeners[bind.n];
            } else {
                listeners = me._listeners;
            }


            for (key in listeners) {
                binds = listeners[key];
                for (i = 0; i < binds.length; i++) {
                    if (compare(bind, binds[i])) {
                        binds.splice(i, 1);
                        i--;
                    }
                }
            }

        };

    let EventDispatcher = bindos.Class.extend({
        on(events, fn, context, callOnce) {
            let self = this,
                ctx,
                eventNames,
                i,
                l,
                event_name,
                bind,
                binds,
                curBind;

            if (typeof events == 'object') {
                ctx = fn || self;
                for (event_name in events) {
                    self.on(event_name, events[event_name], ctx, callOnce);
                }
                return this;
            }

            if (typeof fn !== 'function') {
                throw TypeError('function expected');
            }

            if (!context) {
                context = self;
            }

            eventNames = events.split(eventSplitter);
            for (i = 0, l = eventNames.length; i < l; i++) {
                bind = makeBind(eventNames[i], fn, context, callOnce);

                binds = self._listeners || {};

                curBind = binds[bind.n] || [];

                curBind.push(bind);

                binds[bind.n] = curBind;

                self._listeners = binds;


            }
            return self;
        },

        off(events, fn, context) {
            let me = this, i, l, eventNames;
            if (!events) {
                remove(me, '', fn, context);
                return me;
            }


            eventNames = events.split(eventSplitter);
            for (i = 0, l = eventNames.length; i < l; i++) {
                remove(me, eventNames[i], fn, context);
            }
            return me;
        },

        fire(events, ...rest) {
            if (!this._listeners) {
                return this;
            }

            let me = this,
                i,
                l,
                eventNames,
                bind,
                bindsArray,
                j,
                bindObject;

            eventNames = events.split(eventSplitter);
            for (i = 0, l = eventNames.length; i < l; i++) {

                bind = makeBind(eventNames[i], false, false);

                if (bind.n) {
                    bindsArray = me._listeners[bind.n];
                    if (!bindsArray) {
                        return me;
                    }

                    for (j = 0; j < bindsArray.length; j++) {
                        bindObject = bindsArray[j];

                        if (compare(bind, bindObject)) {
                            //если забинден через one  удаляем
                            if (bindObject.s) {
                                bindsArray.splice(j, 1);
                                j--;
                            }

                            bindObject.fn.apply(bindObject.c, rest);
                        }
                    }
                } else {
                    throw 'not implemented';
                }


            }
            return me;
        },

        one(events, fn, context) {
            return this.on(events, fn, context, true);
        },

        hasListener(event) {
            if (!this._listeners) {
                return false;
            }
            return findBinds(this._listeners, event, false, false, 'any');
        }
    });
    EventDispatcher.prototype.trigger = EventDispatcher.prototype.fire;
    bindos.EventDispatcher = EventDispatcher;
}());

(function () {
    "use strict";


    let modelsMap = {},

        Model = bindos.EventDispatcher.extend({

            setComputeds(names) {
                let self = this;
                names.forEach(
                    (name) => {
                        let computed= self._computeds[name];
                        self.fire('change:' + name, computed.get());
                        if(self.reverseComputedDeps[name]){
                            self.setComputeds(self.reverseComputedDeps[name]);
                        }
                    }
                );
            },

            addComputed(name, options) {
                if (typeof options == 'function') {
                    options = {
                        get: options
                    };
                }
                options.name = name;
                options.model = this;
                this._computeds[name] = new Model.Computed(options);
            },

            removeComputed(name) {
                var self = this;
                delete self._computeds[name];
                for (let key in self.reverseComputedDeps) {
                    let deps = self.reverseComputedDeps[key];
                    self.reverseComputedDeps[key] = deps.filter((n) => n != name);
                }
            },

            useDefineProperty: true,
            mapping: false,
            computeds: {},
            fields: {},
            idAttribute: 'id',
            constructor(data = {}) {

                var self = this;


                this.reverseComputedDeps = {};

                this._computeds = {};



                self.attributes = $.extend({}, self.fields, self.parse(data));




                for (let compName in self.computeds) {
                    self.addComputed(compName, self.computeds[compName]);
                }

                if (self.useDefineProperty) {
                    let serialized = self.serialize();
                    for (let key in serialized) {
                        (function (key) {
                            Object.defineProperty(self, key, {
                                get: function () {
                                    return this.prop(key);
                                },
                                set: function (val) {
                                    this.prop(key, val);
                                }
                            });
                        }(key));
                    }
                }

                self._changed = {};


                if (self.idAttribute != 'id' || !self.useDefineProperty) {
                    self.id = self.attributes[self.idAttribute];
                }

                self.cid = $.uniqueId('c');
                //заносим в глобальную коллекцию
                if (self.mapping && self.id) {
                    modelsMap[self.mapping] = modelsMap[self.mapping] || {};
                    modelsMap[self.mapping][self.id] = self;
                }
            },

            serialize() {
                return $.extend({}, this.attributes, $.mapValues(this._computeds, function (comp) {
                    return comp.value;
                }));
            },


            toJSON() {
                return this.serialize();
            },


            parse(json) {
                return json;
            },


            update(json) {
                this.prop(this.parse(json));
                this._changed = {};
                return this;
            },


            prop(key, value) {
                var self = this,
                    comp;

                //if get
                if (arguments.length === 1 && typeof key === 'string') {

                    //if computed
                    if (comp = self._computeds[key]) {
                        return comp.value;
                    }
                    //if attribute
                    return self.attributes[key];
                }

                //if set
                var values = {},
                    changed = {};
                if (typeof key === 'string') {
                    values[key] = value;
                } else {
                    values = key;
                }

                for (let key in values) {
                    let val = values[key];
                    changed[key] = self._changed[key] = val;

                    //if computed
                    if (comp = self._computeds[key]) {

                        comp.set(val);
                    } else {
                        self.attributes[key] = val;
                    }

                    if (self.reverseComputedDeps[key]) {
                        self.setComputeds(self.reverseComputedDeps[key]);
                    }
                    if (key === self.idAttribute && !(self.idAttribute == 'id' && self.useDefineProperty)) {
                        self.id = val;
                    }

                    self.fire('change:' + key, val);
                }

                this.fire('change', changed);
                return this;
            },


            validate() {
                return false;
            },


            fetch(options) {
                options = options || {};
                var me = this,
                    opt = {
                        success: function (data) {
                            me.update(data);
                            if (typeof options.success === 'function') {
                                options.success.apply(me, arguments);
                            }
                        },
                        error: function () {
                            if (typeof options.error === 'function') {
                                options.error.apply(me, arguments);
                            }
                        }
                    };

                Model.sync('get', this.url(), $.extend({}, options, opt));
                return this;
            },


            save(data) {

                var me = this,
                    errors = this.validate(data),
                    url;

                if (errors) {
                    this.trigger('invalid', this, errors);
                    return;
                }


                if (typeof this.url == 'function') {
                    url = this.url();
                } else {
                    url = this.url;
                }

                if (data) {
                    this.prop(data);
                }
                if (this.id) {

                    if (Object.keys(me._changed).length === 0) { //нечего сохранять
                        return this;
                    }
                    Model.sync('update', url, {
                        data: me._changed,
                        success: function (data) {
                            me.update(data);
                        }
                    });
                } else {
                    Model.sync('create', url, {
                        data: me.serialize(),
                        success: function (data) {
                            me.update(data);
                        }
                    });
                }
                return this;
            },


            remove() {
                this.fire('remove');
                if (this.id) {
                    Model.sync('delete', this.url(), {});
                }
            }
        });

    Model.extend = function (proto) {
        if (!proto.computeds) {
            proto.computeds = {};
        }
        for (let key in proto.fields) {
            let val = proto.fields[key];
            if (typeof val == 'function') {
                delete proto.fields[key];
                proto.computeds[key] = val;
            }
        }
        return bindos.Class.extend.call(this, proto);
    };

    Model.fromStorage = function (name, id) {
        modelsMap[name] = modelsMap[name] || {};
        return modelsMap[name][id];
    };
    Model.createOrUpdate = function (constuctor, json) {
        var proto = constuctor.prototype,
            fromStorage, idAttr, parsed;
        if (proto.mapping) {
            idAttr = proto.idAttribute;
            parsed = proto.parse(json);
            fromStorage = Model.fromStorage(proto.mapping, parsed[idAttr]);
            if (fromStorage) {
                fromStorage.update(json);
                return fromStorage;
            }
        }
        return new constuctor(json);
    };


    Model.filters = {};


    var filtersSplitter = /\s*\|\s*/,
        filtersSplitter2 = /(\w+)(\s*:\s*['"]([^'"]+)['"])?/;

    Model.hasFilters = function (string) {
        return string.indexOf('|') != -1;
    };

    Model.parseFilters = function (string) {
        var filters = string.split(filtersSplitter),
            value = filters.shift();
        return {
            value: value,
            filters: filters.reduce(function (result, string) {
                var matches = filtersSplitter2.exec(string);
                var options = matches[3];
                var filterName = matches[1];
                result[filterName] = options;
                return result;
            }, {})
        }
    };

    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    const ARGUMENT_NAMES = /([^\s,]+)/g;

    class Computed {

        constructor(options) {
            this.deps = options.deps || [];
            this.name = options.name;
            this.model = options.model;
            this.filters = options.filters || {};
            this.value = undefined;
            if (options.filtersString) {
                this.parseFilters(options.filtersString);
            }
            if (options.get) {
                this.deps = Computed.getFnParams(options.get);
                this.getter = options.get;
            }
            if (options.set) {
                this.setter = options.set;
            }
            this.get();


            var rdps = this.model.reverseComputedDeps;

            this.deps.forEach(function (name) {
                if (!rdps[name]) {
                    rdps[name] = [];
                }
                rdps[name].push(options.name);
            });
        }

        static getFnParams(func) {
            var fnStr = func.toString().replace(STRIP_COMMENTS, '');
            var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
            if (result === null)
                result = [];
            return result;
        }

        getter(value) {
            return value;
        }

        setter(value, name) {
            this.prop(name, value);
        }

        parseFilters(string) {
            var f = Model.parseFilters(string);
            this.deps = [f.value];
            this.filters = f.filters;
        }

        get() {
            var self = this,
                vals = self.deps.reduce(function (array, name) {
                    array.push(self.model.prop(name));
                    return array;
                }, []);
            //var lastValue = self.value;

            var value = self.getter.apply(self.model, vals);
            let result = value;
            for (let filterName in this.filters) {
                let options = this.filters[filterName];
                result = Model.filters[filterName].format(result, options);
            }
            this.value = result;

            return self.value;
        }

        set(value) {
            let result = value;
            for (let filterName in this.filters) {
                let options = this.filters[filterName];
                result = Model.filters[filterName].unformat(result, options);
            }
            this.setter.call(this.model, result, this.name);
            this.get();
        }
    }

    Model.Computed = Computed;
    bindos.Model = Model;
}());

(function () {
    "use strict";

    let Model = bindos.Model;
    var itself = function (self) {
            this.self = self;
        },
        Collection = Model.extend({
            constructor: function (models, attributes) {
                this._super(attributes);

                if (typeof this.model != 'function') {
                    this.model = Model.extend({
                        fields: this.model
                    });
                }

                this.itself = new itself(this);
                this.models = [];
                this.length = 0;

                if (models) {
                    this.reset(models);
                }

            },
            models: [],
            model: Model,
            url: function () {
                return this.baseURL + this.model.prototype.mapping + '/';
            },
            fetch: function (options) {
                options = options || {};
                var me = this,
                    opt = {
                        success: function (data) {
                            me.reset(data, options);
                            if (typeof options.success === 'function') {
                                options.success.apply(me, arguments);
                            }
                        },
                        error: function () {
                            if (typeof options.error === 'function') {
                                options.error.apply(me, arguments);
                            }
                        }
                    },
                    resOpt = _.extend({}, options, opt);
                Model.sync('GET', this.url(), resOpt);
            },
            reset: function (json, options) {
                options = options || {};
                if (!options.add) {
                    this.fire('cut', this.models);
                    this.models = [];
                    this.length = 0;
                }
                if (!json) {
                    this.fire('reset');
                    return this;
                }

                var modelsArr = this.parse(json);
                this.add(modelsArr, 'end');

                if (!options.add) {
                    this.fire('reset');
                }
                return this;
            },
            push: function (model) {
                return this.add(model);
            },
            unshift: function (model) {
                return this.add(model, 0);
            },
            add: function (models, index, silent) {

                var me = this,
                    addedModels = [];

                if (!(models instanceof Array)) {
                    models = [models];
                }

                if (typeof index !== 'number') {
                    index = this.length;
                }


                models.forEach(function (model, ind) {
                    if (!(model instanceof Model)) {
                        model = Model.createOrUpdate(me.model, model);
                    }
                    addedModels.push(model);


                    model.one('remove', function () {
                        me.cutByCid(this.cid);
                    });

                    me.models.splice(index + ind, 0, model);

                });

                this.length = this.models.length;
                if (!silent) {
                    this.fire('add', addedModels, index);
                }
                return this;
            },
            cut: function (id) {
                var found, me = this;
                this.each(function (model, index) {
                    if (model.id === id) {
                        found = me.cutAt(index);
                        return false;
                    }
                });
                return found;
            },
            cutByCid: function (cid) {
                var found,
                    self = this;
                this.each(function (model, index) {
                    if (model.cid === cid) {
                        found = self.cutAt(index);
                        return false;
                    }
                });
                return found;
            },
            shift: function () {
                return this.cutAt(0);
            },
            pop: function () {
                return this.cutAt();
            },
            cutAt: function (index) {
                if (index === undefined) {
                    index = this.models.length - 1;
                }

                var model = this.models.splice(index, 1)[0],
                    cutted;


                this.length = this.models.length;
                cutted = {};
                cutted[index] = model;
                this.fire('cut', cutted);
                return model;
            },
            at: function (index) {
                return this.models[index];
            },
            getByID: function (id) {
                var found;
                this.each(function (model) {
                    if (model.id == id) {
                        found = model;
                        return false;
                    }
                });
                return found;
            },
            getByCid: function (cid) {
                var found;
                this.each(function (model) {
                    if (model.cid == cid) {
                        found = model;
                        return false;
                    }
                });
                return found;
            }
        }),
        whereMethods = ['detect', 'select', 'find', 'every', 'all', 'some', 'any', 'max', 'min', 'sortBy', 'sortByDesc', 'first', 'initial', 'rest', 'last', 'groupBy'],
        methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'foldl', 'foldr',
            'include', 'contains', 'invoke', 'sortedIndex',
            'toArray', 'size', 'without', 'indexOf',
            'shuffle', 'lastIndexOf', 'isEmpty'
        ],
        filterMethods = ['filter', 'reject'],
        sortMethods = ['sortBy', 'sortByDesc', 'shuffle'],
        vanillaMethods = ['forEach'];

    vanillaMethods.forEach((method) => {
        Collection.prototype[method] = function (...args) {
            return this.models[method](...args);
        };
    });

    let filter = function (collection, iteraror, reject) {
        let models = [],
            rejected = {};
        collection.models.forEach((model, index) => {
            let res = iteraror.call(collection, model, index, collection);
            if (reject && !res || !reject && res) {
                models.push(model);
            } else {
                rejected[index] = model;
            }
        });
        return {
            models: models,
            rejected: rejected
        }
    }

    Collection.prototype.each = Collection.prototype.forEach;

    filterMethods.forEach((method) => {
        Collection.prototype[method] = function (iterator) {
            let res = filter(this, iterator, method == 'reject');
            this.models = res.models;
            this.length = res.models.length;
            this.fire('cut', res.rejected);
            return this;
        };
    });

    if (window._) {


        // Sort the object's values by a criterion produced by an iterator.
        _.mixin({
            sortByDesc: function (obj, value, context) {
                return this.sortBy(obj, value, context).reverse();
            }
        });


        var where = function (query) {
            return function (model) {
                var valid = true;
                _.forIn(query, function (value, key) {
                    if (value !== model.attributes[key]) {
                        valid = false;
                        return false;
                    }
                });
                return valid;
            };
        };

        var pluck = function (prop) {
            return function (model) {
                return model.attributes[prop];
            };
        };


        _.each(methods, function (method) {
            Collection.prototype[method] = function (fn, thisArg) {
                return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
            };
        });

        _.each(whereMethods, function (method) {
            Collection.prototype[method] = function (fn, thisArg) {
                if (typeof fn == 'function') {
                    return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
                }
                var query;
                if (typeof fn == 'string') {
                    if (arguments.length == 2) {
                        query = {};
                        query[fn] = thisArg;
                    } else {
                        return _[method](this.models, pluck(fn));
                    }
                }
                if (!query) {
                    query = fn;
                }
                return _[method](this.models, where(query));
            };
        });


        _.each(sortMethods, function (method) {
            itself.prototype[method] = function () {
                var self = this.self,
                    newModels = self[method].apply(self, arguments),
                    indexes = {};
                _.each(newModels, function (model, index) {
                    indexes[index] = self.indexOf(model);
                });
                self.models = newModels;
                self.length = newModels.length;
                self.fire('sort', indexes);
                return self;
            };
        });
    }
    bindos.Collection = Collection;
}());

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
                context = fn.call(self, elem, model);
                if (context === false) {
                    return;
                }
                if (!context) {
                    context = model;
                }
            }

            Array.from(elem.children).forEach((el) => ViewModel.findBinds(el, context));
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

    bindos.ViewModel = ViewModel;
    bindos.Widget = ViewModel.extend({
        autoParseBinds: true,
        wrapReady: true
    });
}());

(function () {
    "use strict";

    let ViewModel = bindos.ViewModel;
    let Model = bindos.Model;
    var zeroEmpty = function (value) {
        return value || (value === 0 ? '0' : '');
    };

    ViewModel.replaceable = function (model, callbackNew, callbackOld) {
        var oldModel;
        var onReplace = function (newModel) {
            if (oldModel) {
                oldModel.off('replace', onReplace);
                callbackOld(oldModel);
            }

            callbackNew(newModel);

            newModel.on('replace', onReplace);
            oldModel = newModel
        }
        onReplace(model);
    }
    ViewModel.applyFilters = function (value, model, callbackNew, callbackOld) {
        var name;

        ViewModel.replaceable(model, function (newModel) {
            if (Model.hasFilters(value)) {
                name = $.uniqueId('vmDynamicComputed');
                newModel.addComputed(name, {
                    filtersString: value
                });
            } else {
                name = value;
            }

            newModel.on('change:' + name, callbackNew);
            callbackNew(newModel.prop(name));
        }, function (oldModel) {

            if (Model.hasFilters(value)) {
                oldModel.removeComputed(name);
            }

            oldModel.off('change:' + name, callbackNew);
            if (callbackOld) {
                callbackOld(oldModel.prop(name));
            }
        });


        return name;
    }

    ViewModel.binds = {
        log: function (el, value, model) {
            this.applyFilters(value, model, function (val) {
                console.log(model, '.', value, '=', val);
            });
        },
        src: function (elem, value, model) {
            this.applyFilters(value, model, (val) => elem.src = val || '');
        },
        html: function (el, value, model) {
            this.applyFilters(value, model, function (val) {
                el.innerHTML = zeroEmpty(val);
            });
        },
        text: function (el, value, model) {
            this.applyFilters(value, model, function (val) {
                el.innerText = zeroEmpty(val);
            });
        },
        prop(el, value, model) {
            let options = this.parseOptionsObject(value);
            for (let key in options) {
                ((key) => {
                    value = options[key];
                    this.applyFilters(value, model, (val) => {
                        el[key] = val;
                    });
                })(key)
            }
        },
        checked(el, value, model) {
            let name = this.applyFilters(value, model, (val) => {
                el.checked = val;
            });

            el.on('change', () => {
                model.prop(name, el.checked);
            })
        },
        value: function (el, value, model) {
            var name = this.applyFilters(value, model, function (val) {
                if(el.value !== val){
                    el.value = zeroEmpty(val);
                }

            });
            ['change', 'keyup', 'keydown'].forEach(function (event) {
                el.on(event, function () {
                    model.prop(name, el.value);
                });
            });

        },
        attr: function (el, value, context) {
            $.forIn(this.parseOptionsObject(value), function (condition, attrName) {
                ViewModel.applyFilters(condition, context, function (val) {
                    if (val !== false && val !== undefined && val !== null) {
                        el.setAttribute(attrName, val);
                    } else {
                        el.removeAttribute(attrName);
                    }
                });
            });
        },
        style: function (el, value, context) {
            $.forIn(this.parseOptionsObject(value), function (condition, style) {
                ViewModel.applyFilters(condition, context, function (val) {
                    el.style[style] = val;
                });
            });
        },
        css: function (el, value, model) {
            $.forIn(this.parseOptionsObject(value), function (condition, className) {
                ViewModel.applyFilters(condition, model, function (val) {
                    el.classList.toggle(className, val);
                });
            });
        },
        display: function (el, value, context) {
            ViewModel.applyFilters(value, context, function (val) {
                //todo: implement for non block elements
                let visibleDisplay = 'block';
                el.style.display = val ? visibleDisplay : 'none';
            });
        },
        className: function (el, value, context) {
            var oldClassName;

            ViewModel.applyFilters(value, context, function (className) {
                if (oldClassName) {
                    el.classList.remove(oldClassName);
                }
                if (className) {
                    el.classList.add(className);
                }
                oldClassName = className;
            });
        },
        view: function (el, value, context, addArgs) {
            var options, ViewModelClass, args, vm, values;
            try {
                options = this.parseOptionsObject(value);
            } catch (error) {
                values = value.split(/\s*,\s*/);
                options = {
                    'class': values[0],
                    'name': values[1]
                };
            }

            if (options['class']) {
                ViewModelClass = this.evil(options['class'], context, addArgs)();
            } else {
                ViewModelClass = ViewModel.extend({
                    autoParseBinds: true
                });
            }
            args = {
                el: el
            };
            if (options.options) {
                $.forIn(options.options, function (value, key) {
                    args[key] = ViewModel.evil(value, context, addArgs)();
                });
            }

            vm = new ViewModelClass(args);
            if (options.name) {
                context[options.name] = vm;
            }

            return false;
        }
    };
    var bindSplitter = /\s*;\s*/,
        firstColonRegex = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*$/,
        commaSplitter = /\s*,\s*/,
        dataBind = function (name, el, value, context, addArgs) {
            el.removeAttribute(name);
            var newCtx, breakContextIsSent;
            if (value) {
                let binds = value.split(bindSplitter);
                for (let cBind of binds) {
                    var arr = cBind.match(firstColonRegex),
                        bindName, bindVal, bindFn;
                    if (!arr) {
                        bindName = cBind;
                        bindVal = '';
                    } else {
                        bindName = arr[1];
                        bindVal = arr[2];
                    }

                    bindName = bindName.split(commaSplitter);

                    for (let ccBind of bindName) {
                        if (ccBind && ccBind.charAt(0) !== '!') {
                            bindFn = ViewModel.binds[ccBind];

                            if (bindFn) {
                                newCtx = bindFn.call(ViewModel, el, bindVal, context, addArgs);

                                if (newCtx === false) {
                                    breakContextIsSent = true;
                                } else if (newCtx) {
                                    context = newCtx;
                                }
                            } else {
                                console.warn('Bind: "' + ccBind + '" not exists');
                            }
                        }
                    }
                }
            }
            if (breakContextIsSent) {
                return false;
            }
            //console.log(newCtx);
            return context;
        };


    ViewModel.bindSelectors = {
        '[data-bind]': function (el, context) {
            return dataBind('data-bind', el, el.getAttribute('data-bind'), context);
        }
    };


    Model.filters._sysEmpty = {
        format: zeroEmpty
    };

    ViewModel.inlineModificators = {
        '{{}}': function (textNode, context) {
            var str = textNode.nodeValue,
                parent,
                docFragment,
                div,
                nodeList = [textNode],
                breakersRegex = ViewModel.inlineModificators['{{}}'].regex;
            breakersRegex.lastIndex = 0;

            if (breakersRegex.test(str)) {

                var parts = str.split(breakersRegex),
                    deps = [],
                    code = "return ";

                _.each(parts, function (word, index) {
                    if (index % 2) {
                        word += ' | _sysEmpty';

                        var f = Model.parseFilters(word);
                        word = _.foldl(f.filters, function (value, options, name) {
                            var opt = '';
                            if (options !== undefined) {
                                opt = ', "' + options + '"';
                            }
                            return 'Model.filters.' + name + '.format(' + value + opt + ')';
                        }, f.value);
                        deps.push(f.value);

                        code += word + '+';
                    } else {
                        code += '"' + word + '"+';
                    }
                });
                code += '"";';

                code = code.replace(/\n/g, '\\n\\\n');


                parent = textNode.parentNode;
                div = document.createElement('div');


                var insertFunction = parent.childNodes.length === 1 ? function (value) {
                    //if this is the only child
                    try {
                        parent.innerHTML = value;
                    } catch (e) {
                        console.log(e);
                    }

                } : function (value) {

                    docFragment = document.createDocumentFragment();

                    try {
                        div.innerHTML = value;
                    } catch (e) {
                        console.log(e);
                    }


                    var newNodeList = _.toArray(div.childNodes),
                        firstNode;


                    firstNode = nodeList[0];

                    while (nodeList[1]) {
                        parent.removeChild(nodeList[1]);
                        nodeList.splice(1, 1);
                    }


                    if (!newNodeList.length) {
                        firstNode.nodeValue = '';
                        nodeList = [firstNode];
                        return;
                    }


                    while (div.childNodes[0]) {
                        docFragment.appendChild(div.childNodes[0]);
                    }


                    if (docFragment.childNodes.length) {
                        try {
                            parent.insertBefore(docFragment, firstNode);
                        } catch (er) {
                            throw er;
                        }
                    }

                    parent.removeChild(firstNode);
                    nodeList = newNodeList;

                };
                var name;
                ViewModel.replaceable(context, function (newModel) {

                    name = _.uniqueId('vmDynamicComputed');

                    try {
                        var func = new Function(deps.join(','), code);
                    } catch (e) {
                        console.log(e);
                        console.log(code);
                    }

                    newModel.addComputed(name, {
                        deps: deps,
                        get: func
                    });

                    newModel.on('change:' + name, insertFunction);
                    insertFunction(newModel.prop(name));
                }, function (oldModel) {
                    oldModel.removeComputed(name);
                    oldModel.off('change:' + name, insertFunction);
                });


            }

        }
    };
    ViewModel.inlineModificators['{{}}'].regex = /\{\{([\s\S]+?)\}\}/g;


}());

(function () {
    "use strict";
    let ViewModel = bindos.ViewModel;

    ViewModel.binds.withModel = function ($el, name, viewModel) {


        var model;


        this.applyFilters(name, viewModel, function (newModel) {
            if (model) {
                model.fire('replace', newModel);
            }
            model = newModel;
        });

        return model;
    };


    var bufferViews = {};


    var getCompiledRow = function (templateName, model, index) {
        return false;
        if (!bufferViews[templateName]) {
            return false;
        }

        if (!bufferViews[templateName].length) {
            return false;
        }


        var $row = bufferViews[templateName].pop();



        return $row;
    };
/*
    setInterval(function () {

        _.each(bufferViews, function (arr, key) {
            _.each(arr, function ($view) {
                $view.clearBinds();
                $view.data('nkModel', '');
            });
            bufferViews[key] = [];
        });

    }, 5 * 60 * 1000);
*/

    ViewModel.binds.each = function (elem, value, model) {
        var
            values,
            collectionName,
            templateName,
            //заглушка чтобы быстро делать off
            ctx = {},
            oldCollection,
            rawTemplate,
            elName = elem.tagName.toLowerCase(),
            compiledTemplateName;


        values = value.split(/\s*,\s*/);
        collectionName = values[0];
        templateName = values[1];


        rawTemplate = templateName ? '' : elem.innerHTML;


        compiledTemplateName = templateName ? templateName : $.uniqueId('nkEachModelTemplate');

        if (!collectionName) {
            collectionName = 'collection';
        }
        bufferViews[compiledTemplateName] = [];


        this.applyFilters(collectionName, model, function (collection) {
            elem.empty();
            var tempChildrenLen,
                templateConstructor,
                template,
                onReset;

            if (!collection) {
                return;
            }



            tempChildrenLen = 1;


            templateConstructor = function (rawTemplate) {
                var tmplEl = $.parse(rawTemplate)

                if (!tmplEl.length) {
                    tmplEl = [tmplEl];
                }

                return function (model, $index, $parent) {

                    var $children = getCompiledRow(compiledTemplateName, model, $index);
                    let clone = [];
                    if (!$children) {
                        for (let el of tmplEl) {
                            el = el.cloneNode(true);
                            ViewModel.findBinds(el, model);
                            clone.push(el);
                        }
                    }

                    tempChildrenLen = clone.length;
                    return clone;
                };
            };



            //template принимает модель и возвращает ее DOM html представление
            template = templateName ? ViewModel.tmpl.get(templateName, templateConstructor) : templateConstructor(rawTemplate);


            var i = 0;

            elem.empty();

            let frag = document.createDocumentFragment();

            function appendChildren(container, children) {
                for (let ch of children) {
                    container.appendChild(ch);
                }
            }

            collection.each((model) => {
                appendChildren(frag, template(model, i++, collection));
            });

            elem.appendChild(frag);



            collection.on('add', function (newModels, index, lastIndex) {
                var i = 0,
                    html = '';
                var _index = lastIndex || index;


                //console.log(newModels);
                let frag = document.createDocumentFragment();

                for (let model of newModels) {
                    appendChildren(frag, template(model, _index + i++, collection));
                }

                if (index === 0) {
                    if (!elem.firstChild) {
                        elem.appendChild(frag);
                    } else {
                        elem.insertBefore(elem.firstChild, frag);
                    }

                } else if (!index || index === collection.length - newModels.length) {
                    elem.appendChild(frag);
                } else {
                    elem.insertBefore(elem.children[index * tempChildrenLen], frag);
                }

            }, ctx);

            //collection.on('reset', onReset, ctx);
            collection.on('cut', function (rejectedModels) {

                var index, model, slice;

                var children = Array.from(elem.children);
                for (index in rejectedModels) {
                    index *= 1;
                    model = rejectedModels[index];
                    model.off(0, 0, ctx);

                    slice = children.slice(index, index + tempChildrenLen);

                    bufferViews[compiledTemplateName].push(slice);
                    for (let el of slice) {
                        elem.removeChild(el);
                    }
                }

            }, ctx);
            collection.on('sort', function (indexes) {
                var $tempDiv = $(document.createElement(elName)),
                    $children = $el.children();

                _.each(indexes, function (newIndex, oldIndex) {
                    $tempDiv.append($children.slice(newIndex, newIndex + tempChildrenLen));
                });
                $el.append($tempDiv.children());
            }, ctx);


        }, function (oldCollection) {
            oldCollection.off(0, 0, ctx);

            oldCollection.each(function (model) {
                model.off(0, 0, ctx);
            });
        });


        return false;
    };

}());
