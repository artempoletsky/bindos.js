(function (window) {
    "use strict";
    /*globals _*/
    var ctor = function () {
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
        var ParentClass = this,
            Constructor = function () {
                this._constructor.apply(this, arguments);
            };
        if (props.hasOwnProperty('constructor')) {
            props._constructor = props.constructor;
        }

        ctor.prototype = ParentClass.prototype;
        Constructor.prototype = new ctor();
        //_.extend(Constructor.prototype,props);

        //*
        _.forOwn(props, function (val, key) {
            Constructor.prototype[key] =
                //если функция
                typeof val === 'function' &&
                    //не Observable и не конструктор
                    val._notSimple === undefined &&
                    //и содержит _super
                    fnTest.test(val.toString())
                    ? function () {
                    var oldSuper = this._super, result;
                    this._super = ParentClass.prototype[key];
                    result = val.apply(this, arguments);
                    this._super = oldSuper;
                    return result;
                } : val;
        });//*/

        Constructor.prototype.constructor = Constructor;
        Constructor._notSimple = true;
        Constructor.extend = ParentClass.extend;
        Constructor.create = ParentClass.create;
        return Constructor;

    };


    Class.create = function (proto) {
        var args = _.toArray(arguments),
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
    window.Class = Class;
}(this));
(function (window) {
    "use strict";
    /*globals _, Class*/

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement, fromIndex) {
            return _.indexOf(this, searchElement, fromIndex);
        };
    }

    var eventSplitter = /\s+/,
        namespaceSplitter = '.',


        makeBind = function (event, fn, context, isSignal) {
            var arr = event.split(namespaceSplitter);
            return {
                c: context,
                s: isSignal,
                fn: fn,
                n: arr[0],
                ns: arr.slice(1)
            };
        },

        add = function (self, bind) {
            var binds, curBind;

            binds = self._listeners || {};

            curBind = binds[bind.n] || [];

            curBind.push(bind);

            binds[bind.n] = curBind;

            self._listeners = binds;
        },

        compare = function (request, target) {
            var compared = (!request.fn || request.fn === target.fn)
                && (!request.n || request.n === target.n)
                && (!request.c || request.c === target.c), ns2;
            //сравнивает пространсва имен
            if (compared && request.ns.length) {
                ns2 = target.ns;
                compared = !_.any(request.ns, function (val) {
                    return ns2.indexOf(val);
                });
            }
            return compared;
        },


        findBinds = function (binds, event, fn, context, mode) {
            var result = mode === 'any' ? false : [],
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
            var bind, i, l;
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

            var listeners = {};
            if (bind.n) {
                listeners[bind.n] = me._listeners[bind.n];
            } else {
                listeners = me._listeners;
            }

            _.each(listeners, function (binds) {
                for (i = 0; i < binds.length; i++) {
                    if (compare(bind, binds[i])) {
                        binds.splice(i, 1);
                        i--;
                    }
                }
            });

        },
        Events = Class.extend({
            on: function (events, fn, context, callOnce) {
                var self = this,
                    ctx,
                    eventNames,
                    i,
                    l,
                    event_name,
                    bind,
                    binds,
                    curBind;

                if (_.isObject(events)) {
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
                    context = this;
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
            off: function (events, fn, context) {
                var me = this, i, l, eventNames;
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
            fire: function (events) {
                if (!this._listeners) {
                    return this;
                }
                //все кроме events передается аргументами в каждый колбек
                var args = _.rest(arguments, 1),
                    me = this,
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

                                bindObject.fn.apply(bindObject.c, args);
                            }
                        }
                    } else {
                        throw 'not implemented';
                    }


                }
                return me;
            },
            one: function (events, fn, context) {
                return this.on(events, fn, context, true);
            },
            hasListener: function (event) {
                if (!this._listeners) {
                    return false;
                }
                return findBinds(this._listeners, event, false, false, 'any');
            }
        });
    Events.prototype.trigger = Events.prototype.fire;
    window.Events = Events;
}(this));
(function (window) {
    "use strict";


    var modelsMap = {},

        Model = Events.extend({
            reverseComputedDeps: {},
            setComputeds: function (names) {
                var self = this;
                _.each(names, function (name) {
                    var val = self._computeds[name].get();
                    self.fire('change:' + name, val);
                });
            },
            addComputed: function (name, options) {
                options.name = name;
                options.model = this;
                this._computeds[name] = new Model.Computed(options);
            },
            removeComputed: function (name) {
                var self = this;
                delete self._computeds[name];
                _.each(self.reverseComputedDeps, function (deps, key) {
                    self.reverseComputedDeps[key] = _.without(deps, name);
                });
            },
            constructor: function (data) {

                var self = this;


                data = data || {};

                self.attributes = _.extend({}, self.defaults, self.parse(data));

                this.reverseComputedDeps = {};
                this._computeds = {};

                _.each(self.computeds, function (options, compName) {
                    self.addComputed(compName, options);
                });

                if (self.useDefineProperty) {
                    _.each(self.serialize(), function (value, key) {
                        Object.defineProperty(self, key, {
                            get: function () {
                                return this.prop(key);
                            },
                            set: function (val) {
                                this.prop(key, val);
                            }
                        });
                    });
                }

                self._changed = {};


                if (self.idAttribute != 'id' || !self.useDefineProperty) {
                    self.id = self.attributes[self.idAttribute];
                }

                self.cid = _.uniqueId('c');
                //заносим в глобальную коллекцию
                if (self.mapping && self.id) {
                    modelsMap[self.mapping] = modelsMap[self.mapping] || {};
                    modelsMap[self.mapping][self.id] = self;
                }
            },
            idAttribute: 'id',
            mapping: false,
            useDefineProperty: true,
            computeds: {},
            _computeds: {},
            defaults: {},
            serialize: function () {
                return _.extend({}, this.attributes, _.mapValues(this._computeds, function (comp, name) {
                    return comp.value;
                }));
            },
            toJSON: function () {
                return this.serialize();
            },
            parse: function (json) {
                return json;
            },
            baseURL: '/',
            url: function () {
                return this.baseURL + (this.mapping ? this.mapping + '/' : '') + (this.id ? this.id + '/' : '');
            },
            update: function (json) {
                this.prop(this.parse(json));
                this._changed = {};
                return this;
            },
            prop: function (key, value) {
                var self = this, comp;

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
                var values = {}, changed = {};
                if (typeof key === 'string') {
                    values[key] = value;
                } else {
                    values = key;
                }

                _.each(values, function (val, key) {
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
                });
                this.fire('change', changed);
                return this;
            },

            validate: function () {
                return false;
            },
            fetch: function (options) {
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

                Model.sync('get', this.url(), _.extend({}, options, opt));
                return this;
            },
            save: function (data) {

                var me = this,
                    errors = this.validate(data),
                    url;

                if (errors) {
                    this.trigger('invalid', this, errors);
                    return;
                }


                if (_.isFunction(this.url)) {
                    url = this.url();
                } else {
                    url = this.url;
                }

                if (data) {
                    this.prop(data);
                }
                if (this.id) {

                    if (_.keys(me._changed).length === 0) {//нечего сохранять
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
            remove: function () {
                this.fire('remove');
                if (this.id) {
                    Model.sync('delete', this.url(), {});
                }
            }
        });

    Model.fromStorage = function (name, id) {
        modelsMap[name] = modelsMap[name] || {};
        return modelsMap[name][id];
    };
    Model.createOrUpdate = function (constuctor, json) {
        var proto = constuctor.prototype, fromStorage, idAttr, parsed;
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

    Model.sync = function (method, url, options) {
        options = options || {};
        var data = {
            method: method
        };
        if (method === 'PUT') {
            method = 'POST';
        }

        $.extend(data, options.data);
        $.ajax({
            url: url,
            dataType: 'json',
            type: method,
            data: data,
            success: options.success,
            error: options.error
        });
    };

    Model.filters = {};


    var filtersSplitter = /\s*\|\s*/,
        filtersSplitter2 = /(\w+)(\s*:\s*['"]([^'"]+)['"])?/;

    Model.hasFilters = function (string) {
        return string.indexOf('|') != -1;
    };

    Model.parseFilters = function (string) {
        var filters = string.split(filtersSplitter), value = filters.shift();
        return {
            value: value,
            filters: _.foldl(filters, function (result, string) {
                var matches = filtersSplitter2.exec(string);
                var options = matches[3];
                var filterName = matches[1];
                result[filterName] = options;
                return result;
            }, {})
        }
    };

    Model.Computed = Class.extend({

        constructor: function (options) {
            this.deps = options.deps || [];
            this.name = options.name;
            this.model = options.model;
            this.filters = options.filters || {};
            if (options.filtersString) {
                this.parseFilters(options.filtersString);
            }
            if (options.get) {
                this.getter = options.get;
            }
            if (options.set) {
                this.setter = options.set;
            }
            this.get();


            var rdps = this.model.reverseComputedDeps;
            _.each(this.deps, function (name) {
                if (!rdps[name]) {
                    rdps[name] = [];
                }
                rdps[name].push(options.name);
            });
        },
        value: undefined,
        deps: [],
        model: undefined,
        filters: {
            /*
             filt1: options,
             filt2: options
             */
        },
        getter: function (value) {
            return value;
        },
        setter: function (value, name) {
            this.prop(name, value);
        },
        parseFilters: function (string) {
            var f = Model.parseFilters(string);
            this.deps = [f.value];
            this.filters = f.filters;
        },
        get: function () {
            var self = this, vals = _.foldl(self.deps, function (array, name) {
                array.push(self.model.prop(name));
                return array;
            }, []);
            //var lastValue = self.value;

            var value = self.getter.apply(self.model, vals);


            self.value = _.foldl(this.filters, function (result, options, filterName) {
                return Model.filters[filterName].format(result, options);
            }, value);

            return self.value;
        },
        set: function (value) {
            this.setter.call(this.model, _.foldl(this.filters, function (result, options, filterName) {
                return Model.filters[filterName].unformat(result, options);
            }, value), this.name);
            this.get();
        }
    });

    window.Model = Model;
}(this));

(function(window) {
    "use strict";
    /*globals _,$, Model*/
    var itself = function(self) {
        this.self = self;
    },
            Collection = Model.extend({
        constructor: function(models, attributes) {
            this._super();

            this.itself = new itself(this);
            this.models = [];
            this.length = 0;

            if (models) {
                this.reset(models);
            }

        },
        models: [],
        model: Model,
        url: function() {
            return this.baseURL + this.model.prototype.mapping + '/';
        },
        fetch: function(options) {
            options = options || {};
            var me = this,
                    opt = {
                success: function(data) {
                    me.reset(data, options);
                    if (typeof options.success === 'function') {
                        options.success.apply(me, arguments);
                    }
                },
                error: function() {
                    if (typeof options.error === 'function') {
                        options.error.apply(me, arguments);
                    }
                }
            },
            resOpt = _.extend({}, options, opt);
            Model.sync('GET', this.url(), resOpt);
        },
        reset: function(json, options) {
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
        push: function(model) {
            return this.add(model);
        },
        unshift: function(model) {
            return this.add(model, 0);
        },
        add: function(models, index, silent) {

            var me = this,
                    addedModels = [];

            if (!(models instanceof Array)) {
                models = [models];
            }

            if (typeof index !== 'number') {
                index = this.length;
            }

            _.each(models, function(model, ind) {
                if (!(model instanceof Model)) {
                    model = Model.createOrUpdate(me.model, model);
                }
                addedModels.push(model);


                model.one('remove', function() {
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
        cut: function(id) {
            var found, me = this;
            this.each(function(model, index) {
                if (model.id === id) {
                    found = me.cutAt(index);
                    return false;
                }
            });
            return found;
        },
        cutByCid: function(cid) {
            var found,
                    self = this;
            this.each(function(model, index) {
                if (model.cid === cid) {
                    found = self.cutAt(index);
                    return false;
                }
            });
            return found;
        },
        shift: function() {
            return this.cutAt(0);
        },
        pop: function() {
            return this.cutAt();
        },
        cutAt: function(index) {
            if (index === undefined) {
                index = this.models.length - 1;
            }

            var model = this.models.splice(index, 1)[0], cutted;


            this.length = this.models.length;
            cutted = {};
            cutted[index] = model;
            this.fire('cut', cutted);
            return model;
        },
        at: function(index) {
            return this.models[index];
        },
        getByID: function(id) {
            var found;
            this.each(function(model) {
                if (model.id == id) {
                    found = model;
                    return false;
                }
            });
            return found;
        },
        getByCid: function(cid) {
            var found;
            this.each(function(model) {
                if (model.cid == cid) {
                    found = model;
                    return false;
                }
            });
            return found;
        }
    }),
    whereMethods=['detect', 'filter', 'select', 'reject', 'find','every', 'all', 'some', 'any','max', 'min','sortBy', 'sortByDesc', 'first', 'initial', 'rest', 'last', 'groupBy'],
    methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'foldl', 'foldr',         
        'include', 'contains', 'invoke', 'sortedIndex',
        'toArray', 'size', 'without', 'indexOf',
        'shuffle', 'lastIndexOf', 'isEmpty'],
            filterMethods = ['filter', 'reject'],
            sortMethods = ['sortBy', 'sortByDesc', 'shuffle'];

    // Sort the object's values by a criterion produced by an iterator.
    _.mixin({
        sortByDesc: function(obj, value, context) {
            return this.sortBy(obj, value, context).reverse();
        }
    });


    var where = function(query) {        
        return function(model) {
            var valid=true;
            _.forIn(query, function(value, key) {
                if (value !== model.attributes[key]) {                    
                    valid=false;
                    return false;
                }
            });
            return valid;
        };
    };
    
    var pluck=function(prop){
        return function(model) {            
            return model.attributes[prop];
        };
    };



    _.each(methods, function(method) {
        Collection.prototype[method] = function(fn, thisArg) {            
            return _[method].apply(_, [this.models].concat(_.toArray(arguments)));           
        };
    });
    
    _.each(whereMethods, function(method) {
        Collection.prototype[method] = function(fn, thisArg) {
            if(typeof fn=='function'){
                return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
            }            
            var query;            
            if(typeof fn=='string'){
                if(arguments.length==2){
                    query={};
                    query[fn]=thisArg;
                }else {
                    return _[method](this.models, pluck(fn));
                }                
            }            
            if(!query){
                query=fn;
            }                        
            return _[method](this.models, where(query));            
        };
    });


    _.each(filterMethods, function(method) {
        itself.prototype[method] = function() {
            var antonym = method === 'filter' ? 'reject' : 'filter',
                    self = this.self,
                    args = _.toArray(arguments),
                    newModels = self[method].apply(self, arguments),
                    rejectedModels = self[antonym].apply(self, arguments),
                    indexes = {};
            _.each(rejectedModels, function(model) {
                indexes[self.indexOf(model)] = model;
            });
            self.models = newModels;
            self.length = newModels.length;
            self.fire('cut', indexes);
            return self;
        };
    });

    _.each(sortMethods, function(method) {
        itself.prototype[method] = function() {
            var self = this.self,
                    newModels = self[method].apply(self, arguments),
                    indexes = {};
            _.each(newModels, function(model, index) {
                indexes[index] = self.indexOf(model);
            });
            self.models = newModels;
            self.length = newModels.length;
            self.fire('sort', indexes);
            return self;
        };
    });

    window.Collection = Collection;
}(this));
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
                this.$el = $(el);
                this.parseBinds().delegateEvents();
                return this;
            },
            wrapReady: false,
            $: function(selector){
                return this.$el.find(selector);
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
                    me._cid = _.uniqueId('vm');
                }
                if (!me.el) {
                    me.el = 'div';
                }



                me._super();



                var ctor=function(){
                    if (typeof me.el === 'string') {
                        if (simpleTagRegex.test(me.el) && me.el !== 'html' && me.el !== 'body') {
                            me.el = document.createElement(me.el);
                        } else {
                            me.el = $(me.el)[0];
                        }

                    }

                    me.$el = $(me.el);
                    _.each(me.shortcuts, function (selector, name) {
                        me[name] = me.$(selector);
                    });


                    if (me.autoParseBinds) {
                        me.parseBinds();
                    }

                    me.delegateEvents();

                    me.initialize();
                };

                if(me.wrapReady){
                    $(ctor);
                }else {
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
/*globals ViewModel, $, _, Computed, Observable, ObjectObservable*/
(function () {
    "use strict";


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
                name = _.uniqueId('vmDynamicComputed');
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
            if(callbackOld){
                callbackOld(oldModel.prop(name));
            }
        });


        return name;
    }

    ViewModel.binds = {
        log: function ($el, value, model) {
            this.applyFilters(value, model, function (val) {
                console.log(model, '.', value, '=', val);
            });
        },
        src: function ($el, value, context, addArgs) {
            var elem = $el[0];
            this.findCallAndSubscribe(value, context, addArgs, function (val) {
                elem.src = val || '';
            }, $el);
        },
        html: function ($el, value, model) {
            this.applyFilters(value, model, function (val) {
                $el.html(zeroEmpty(val));
            });
        },
        text: function ($el, value, model) {
            this.applyFilters(value, model, function (val) {
                $el.text(zeroEmpty(val));
            });
        },
        value: function ($el, value, model) {
            var name = this.applyFilters(value, model, function (val) {
                $el.val(zeroEmpty(val));
            });

            $el.on('change keyup keydown', function () {
                var val = $el.val();
                //if ($el.get() !== val) {
                model.prop(name, val);
                //}
            });
        },
        attr: function ($el, value, context) {
            var elem = $el[0];
            _.each(this.parseOptionsObject(value), function (condition, attrName) {
                ViewModel.applyFilters(condition, context, function (val) {
                    if (val !== false && val !== undefined && val !== null) {
                        elem.setAttribute(attrName, val);
                    } else {
                        elem.removeAttribute(attrName);
                    }
                });
            });
        },
        style: function ($el, value, context) {
            _.each(this.parseOptionsObject(value), function (condition, style) {
                ViewModel.applyFilters(condition, context, function (val) {
                    $el.css(style, val);
                });
            });
        },
        css: function ($el, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function (condition, className) {
                ViewModel.applyFilters(condition, context, function (val) {
                    if (val) {
                        $el.addClass(className);
                    }
                    else {
                        $el.removeClass(className);
                    }
                });
            });
        },
        display: function ($el, value, context) {
            ViewModel.applyFilters(value, context, function (val) {
                if (val) {
                    $el.show();
                }
                else {
                    $el.hide();
                }
            });
        },
        click: function ($el, value, context, addArgs) {
            var fn = this.evil(value, context, addArgs, $el)();
            $el.click(function () {
                fn.apply(context, arguments);
            });
        },
        className: function ($el, value, context) {
            var oldClassName;

            ViewModel.applyFilters(value, context, function (className) {
                if (oldClassName) {
                    $el.removeClass(oldClassName);
                }
                if (className) {
                    $el.addClass(className);
                }
                oldClassName = className;
            });
        },
        events: function ($el, value, context, addArgs) {
            var self = this;
            _.each(this.parseOptionsObject(value), function (expr, eventName) {
                var callback = self.evil(expr, context, addArgs)();
                $el.bind(eventName, function (e) {
                    callback.call(context, e);
                });
            });
        },
        view: function ($el, value, context, addArgs) {
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
                el: $el
            };
            if (options.options) {
                _.forOwn(options.options, function (value, key) {
                    args[key] = ViewModel.evil(value, context, addArgs)();
                });
            }

            vm = new ViewModelClass(args);
            if (options.name) {
                context[options.name] = vm;
            }

            return false;
        },
        $click: function ($el, value, context, addArgs) {
            $el.click(this.evil(value, context, addArgs));
            return false;
        }
    };
    var bindSplitter = /\s*;\s*/,
        firstColonRegex = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*$/,
        commaSplitter = /\s*,\s*/,
        dataBind = function (name, $el, value, context, addArgs) {
            $el.removeAttr(name);
            var newCtx, breakContextIsSent;
            if (value) {

                _.each(value.split(bindSplitter), function (cBind) {
                    var arr = cBind.match(firstColonRegex), bindName, bindVal, bindFn;
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
                                newCtx = bindFn.call(ViewModel, $el, bindVal, context, addArgs);

                                if (newCtx === false) {
                                    breakContextIsSent = true;
                                } else if (newCtx) {
                                    context = newCtx;
                                }
                            } else {
                                console.warn('Bind: "' + ccBind + '" not exists');
                            }
                        }
                    });
                });
            }
            if (breakContextIsSent) {
                return false;
            }
            //console.log(newCtx);
            return context;
        };


    ViewModel.tag = function (tagName, behavior) {
        document.createElement(tagName);// for IE
        ViewModel.tags[tagName] = behavior;
    };
    ViewModel.removeTag = function (tagName) {
        delete ViewModel.tags[tagName];
    };
    ViewModel.tags = {};

    ViewModel.customAttributes = {
        'data-bind': function ($el, value, context, addArgs) {
            return dataBind('data-bind', $el, value, context, addArgs);
        },
        'nk': function ($el, value, context, addArgs) {
            return dataBind('nk', $el, value, context, addArgs);
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

                var parts = str.split(breakersRegex), deps = [], code = "return ";

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
                //$el = $(parent);
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


                    var newNodeList = _.toArray(div.childNodes), firstNode;


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
                            throw  er;
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
    /*globals _, ViewModel, $*/
    var rawTemplates = {},
        compiledTemplates = {};
    /**
     * Объект для работы с темплейтами
     * @type {{Object}}
     */
    ViewModel.tmpl = {
        setRawTemplate: function (name, html) {
            rawTemplates[name] = html;
        },
        /**
         * Возвращает сырой текстовый темплейт по имени
         * @param name {String} имя темплейта
         * @returns {String} текстовое представление темплейта
         */
        getRawTemplate: function (name) {
            return rawTemplates[name];
        },
        /**
         * Если есть возвращает скомпилированный темплейт,
         * если нет создает его с помощью constructorFunction
         * @param {String} rawTemplateName
         * @param {function} constructorFunction
         * @returns {function}
         */
        get: function (rawTemplateName, constructorFunction) {
            var template = compiledTemplates[rawTemplateName],
                rawTemplate;
            if (!template) {
                rawTemplate = rawTemplates[rawTemplateName];
                if (rawTemplate === undefined) {
                    throw  new Error('Raw template: "' + rawTemplateName + '" is not defined');
                }
                compiledTemplates[rawTemplateName] = template = constructorFunction(rawTemplate);
            }
            return template;
        }
    };

    ViewModel.binds.template = function (elem, value, context, addArgs) {
        var $el = $(elem), splt = value.split(/\s*,\s*/), name = splt[0], constuctor = splt[1];

        rawTemplates[name] = $el.html();
        $el.remove();
        if (constuctor) {
            constuctor = this.evil(constuctor, context, addArgs);
            compiledTemplates[name] = constuctor(rawTemplates[name]);
        }
        return false;
    };

}());
(function () {
    "use strict";
    /*globals ViewModel, Observable, Computed, _, $*/

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

    setInterval(function () {

        _.each(bufferViews, function (arr, key) {
            _.each(arr, function ($view) {
                $view.clearBinds();
                $view.data('nkModel', '');
            });
            bufferViews[key] = [];
        });

    }, 5 * 60 * 1000);


    ViewModel.binds.eachModel = function ($el, value, model) {
        var
            values,
            collectionName,
            templateName,
            elem = $el[0],
        //заглушка чтобы быстро делать off
            ctx = {},
            oldCollection,
            rawTemplate,
            elName = elem.tagName.toLowerCase(),
            compiledTemplateName;


        values = value.split(/\s*,\s*/);
        collectionName = values[0];
        templateName = values[1];


        rawTemplate = templateName ? '' : $el.html();


        compiledTemplateName = templateName ? templateName : _.uniqueId('nkEachModelTemplate');

        bufferViews[compiledTemplateName] = [];


        this.applyFilters(collectionName, model, function(collection){
            $el.empty();
            var tempChildrenLen,
                templateConstructor,
                template,
                onReset;

            if (!collection) {
                return;
            }



            tempChildrenLen = 1;


            templateConstructor = function (rawTemplate) {
                var $tmplEl = $(rawTemplate);
                return function (model, $index, $parent) {

                    var $children = getCompiledRow(compiledTemplateName, model, $index);


                    if (!$children) {
                        $children = $tmplEl.clone();
                        $children.each(function(){
                            ViewModel.findBinds(this, model);
                        });
                    }

                    tempChildrenLen = $children.length;
                    return $children;
                };
            };



            //template принимает модель и возвращает ее DOM html представление
            template = templateName ? ViewModel.tmpl.get(templateName, templateConstructor) : templateConstructor(rawTemplate);


            var html = $(document.createElement(elName)),
                i = 0;
            //$el.children().clearBinds();
            $el.empty();


            collection.each(function (model) {
                html.append(template(model, i++, collection));
            });

            $el.append(html.children());



            collection.on('add', function (newModels, index, lastIndex) {
                var i = 0,
                    html = '';
                var _index = lastIndex || index;


                //console.log(newModels);

                html = $(document.createElement(elName));


                _.each(newModels, function (model) {


                    html.append(template(model, _index + i++, collection));
                });


                html = html.children();

                if (index === 0) {

                    $el.prepend(html);
                } else if (!index || index === collection.length - newModels.length) {
                    $el.append(html);
                } else {
                    $el.children().eq(index * tempChildrenLen).before(html);
                }

            }, ctx);

            //collection.on('reset', onReset, ctx);
            collection.on('cut', function (rejectedModels) {

                var index, model, $slice, $cutEl;

                var $children = $el.children();
                for (index in rejectedModels) {
                    index *= 1;
                    model = rejectedModels[index];
                    model.off(0, 0, ctx);

                    $slice = $children.slice(index, index + tempChildrenLen);

                    bufferViews[compiledTemplateName].push($slice);

                    $slice.detach();


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


        }, function(oldCollection){
            oldCollection.off(0, 0, ctx);

            oldCollection.each(function (model) {
                model.off(0, 0, ctx);
            });
        });


        return false;
    };

}());
/**
 * Router from backbone
 */
(function (window) {
    "use strict";
    /*globals _*/

    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var optionalParam = /\((.*?)\)/g;
    var namedParam    = /(\(\?)?:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    // Routers map faux-URLs to actions, and fire events when routes are
    // matched. Creating a new one sets its `routes` hash, if not set statically.
    window.Router = Events.extend({

        constructor: function ( options ) {
            options || (options = {});
            if (options.routes) this.routes = options.routes;
            this._bindRoutes();
            this.initialize.apply(this, arguments);
        },

        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize: function(){},

        // Manually bind a single named route to a callback. For example:
        //
        //     this.route('search/:query/p:num', 'search', function(query, num) {
        //       ...
        //     });
        //
        route: function(route, name, callback) {
            if (!_.isRegExp(route)) route = this._routeToRegExp(route);
            if (_.isFunction(name)) {
                callback = name;
                name = '';
            }
            if (!callback) callback = this[name];
            var router = this;
            window.History.route(route, function(fragment) {
                var args = router._extractParameters(route, fragment);
                callback && callback.apply(router, args);
                router.trigger.apply(router, ['route:' + name].concat(args));
                router.trigger('route', name, args);
                window.History.trigger('route', router, name, args);
            });
            return this;
        },

        // Simple proxy to `Backbone.history` to save a fragment into the history.
        navigate: function(fragment, options) {
            window.History.navigate(fragment, options);
            return this;
        },

        // Bind all defined routes to `Backbone.history`. We have to reverse the
        // order of the routes here to support behavior where the most general
        // routes can be defined at the bottom of the route map.
        _bindRoutes: function() {
            if (!this.routes) return;
            this.routes = _.result(this, 'routes');
            var route, routes = _.keys(this.routes);
            while ((route = routes.pop()) != null) {
                this.route(route, this.routes[route]);
            }
        },

        // Convert a route string into a regular expression, suitable for matching
        // against the current location hash.
        _routeToRegExp: function(route) {
            route = route.replace(escapeRegExp, '\\$&')
                .replace(optionalParam, '(?:$1)?')
                .replace(namedParam, function(match, optional) {
                    return optional ? match : '([^\/]+)';
                })
                .replace(splatParam, '(.*?)');
            return new RegExp('^' + route + '$');
        },

        // Given a route, and a URL fragment that it matches, return the array of
        // extracted decoded parameters. Empty or unmatched parameters will be
        // treated as `null` to normalize cross-browser behavior.
        _extractParameters: function(route, fragment) {
            var params = route.exec(fragment).slice(1);
            return _.map(params, function(param) {
                return param ? decodeURIComponent(param) : null;
            });
        }
    });
}(this));
// History from backbone
(function ( window ) {
    "use strict";

    // Cached regex for stripping a leading hash/slash and trailing space.
    var routeStripper = /^[#\/]|\s+$/g;

    // Cached regex for stripping leading and trailing slashes.
    var rootStripper = /^\/+|\/+$/g;

    // Cached regex for detecting MSIE.
    var isExplorer = /msie [\w.]+/;

    // Cached regex for removing a trailing slash.
    var trailingSlash = /\/$/;

    // Handles cross-browser history management, based on either
    // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
    // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
    // and URL fragments. If the browser supports neither (old IE, natch),
    // falls back to polling.
    var History = Events.extend({

        // The default interval to poll for hash changes, if necessary, is
        // twenty times a second.
        interval: 50,

        // Has the history handling already been started?
        started: false,

        constructor: function () {
            this.handlers = [];
            _.bindAll(this, 'checkUrl');

            // Ensure that `History` can be used outside of the browser.
            if (typeof window !== 'undefined') {
                this.location = window.location;
                this.history = window.history;
            }
        },

        // Gets the true hash value. Cannot use location.hash directly due to bug
        // in Firefox where location.hash will always be decoded.
        getHash: function(window) {
            var match = (window || this).location.href.match(/#(.*)$/);
            return match ? match[1] : '';
        },

        // Get the cross-browser normalized URL fragment, either from the URL,
        // the hash, or the override.
        getFragment: function(fragment, forcePushState) {
            if (fragment == null) {
                if (this._hasPushState || !this._wantsHashChange || forcePushState) {
                    fragment = this.location.pathname;
                    var root = this.root.replace(trailingSlash, '');
                    if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
                } else {
                    fragment = this.getHash();
                }
            }
            return fragment.replace(routeStripper, '');
        },

        // Start the hash change handling, returning `true` if the current URL matches
        // an existing route, and `false` otherwise.
        start: function(options) {
            if (this.started) throw new Error("Backbone.history has already been started");
            this.started = true;

            // Figure out the initial configuration. Do we need an iframe?
            // Is pushState desired ... is it available?
            this.options          = _.extend({}, {root: '/'}, this.options, options);
            this.root             = this.options.root;
            this._wantsHashChange = this.options.hashChange !== false;
            this._wantsPushState  = !!this.options.pushState;
            this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
            var fragment          = this.getFragment();
            var docMode           = document.documentMode;
            var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

            // Normalize root to always include a leading and trailing slash.
            this.root = ('/' + this.root + '/').replace(rootStripper, '/');

            if (oldIE && this._wantsHashChange) {
                this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
                this.navigate(fragment);
            }

            // Depending on whether we're using pushState or hashes, and whether
            // 'onhashchange' is supported, determine how we check the URL state.
            if (this._hasPushState) {
                $(window).on('popstate', this.checkUrl);
            } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
                $(window).on('hashchange', this.checkUrl);
            } else if (this._wantsHashChange) {
                this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
            }

            // Determine if we need to change the base url, for a pushState link
            // opened by a non-pushState browser.
            this.fragment = fragment;
            var loc = this.location;
            var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

            // Transition from hashChange to pushState or vice versa if both are
            // requested.
            if (this._wantsHashChange && this._wantsPushState) {

                // If we've started off with a route from a `pushState`-enabled
                // browser, but we're currently in a browser that doesn't support it...
                if (!this._hasPushState && !atRoot) {
                    this.fragment = this.getFragment(null, true);
                    this.location.replace(this.root + this.location.search + '#' + this.fragment);
                    // Return immediately as browser will do redirect to new url
                    return true;

                    // Or if we've started out with a hash-based route, but we're currently
                    // in a browser where it could be `pushState`-based instead...
                } else if (this._hasPushState && atRoot && loc.hash) {
                    this.fragment = this.getHash().replace(routeStripper, '');
                    this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
                }

            }

            if (!this.options.silent) return this.loadUrl();
        },

        // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
        // but possibly useful for unit testing Routers.
        stop: function() {
            $(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
            clearInterval(this._checkUrlInterval);
            this.started = false;
        },

        // Add a route to be tested when the fragment changes. Routes added later
        // may override previous routes.
        route: function(route, callback) {
            this.handlers.unshift({route: route, callback: callback});
        },

        // Checks the current URL to see if it has changed, and if it has,
        // calls `loadUrl`, normalizing across the hidden iframe.
        checkUrl: function(e) {
            var current = this.getFragment();
            if (current === this.fragment && this.iframe) {
                current = this.getFragment(this.getHash(this.iframe));
            }
            if (current === this.fragment) return false;
            if (this.iframe) this.navigate(current);
            this.loadUrl();
        },

        // Attempt to load the current URL fragment. If a route succeeds with a
        // match, returns `true`. If no defined routes matches the fragment,
        // returns `false`.
        loadUrl: function(fragmentOverride) {
            var fragment = this.fragment = this.getFragment(fragmentOverride);
            return _.any(this.handlers, function(handler) {
                if (handler.route.test(fragment)) {
                    handler.callback(fragment);
                    return true;
                }
            });
        },

        // Save a fragment into the hash history, or replace the URL state if the
        // 'replace' option is passed. You are responsible for properly URL-encoding
        // the fragment in advance.
        //
        // The options object can contain `trigger: true` if you wish to have the
        // route callback be fired (not usually desirable), or `replace: true`, if
        // you wish to modify the current URL without adding an entry to the history.
        navigate: function(fragment, options) {
            if (!this.started) return false;
            if (!options || options === true) options = {trigger: !!options};

            fragment = this.getFragment(fragment || '');
            if (this.fragment === fragment) return;
            this.fragment = fragment;

            var url = this.root + fragment;

            // Don't include a trailing slash on the root.
            if (fragment === '' && url !== '/') url = url.slice(0, -1);

            // If pushState is available, we use it to set the fragment as a real URL.
            if (this._hasPushState) {
                this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

                // If hash changes haven't been explicitly disabled, update the hash
                // fragment to store history.
            } else if (this._wantsHashChange) {
                this._updateHash(this.location, fragment, options.replace);
                if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
                    // Opening and closing the iframe tricks IE7 and earlier to push a
                    // history entry on hash-tag change.  When replace is true, we don't
                    // want this.
                    if(!options.replace) this.iframe.document.open().close();
                    this._updateHash(this.iframe.location, fragment, options.replace);
                }

                // If you've told us that you explicitly don't want fallback hashchange-
                // based history, then `navigate` becomes a page refresh.
            } else {
                return this.location.assign(url);
            }
            if (options.trigger) return this.loadUrl(fragment);
        },

        // Update the hash location, either replacing the current entry, or adding
        // a new one to the browser history.
        _updateHash: function(location, fragment, replace) {
            if (replace) {
                var href = location.href.replace(/(javascript:|#).*$/, '');
                location.replace(href + '#' + fragment);
            } else {
                // Some browsers require that `hash` contains a leading #.
                location.hash = '#' + fragment;
            }
        }

    });

    // Create the default Backbone.history.
    window.History = new History;
})(this);
