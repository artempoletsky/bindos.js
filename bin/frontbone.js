(function (window) {
    "use strict";
    /*globals _*/
    var waitForRefresh = [],
        refreshActive = false,
        computedInit = false,
        Observable,
        Computed,
        refreshFn = window.requestAnimationFrame
            || window.webkitRequestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.msRequestAnimationFrame
            || window.oRequestAnimationFrame
            || function (cb) {
            setTimeout(function () {
                cb();
            }, 1000 / 15);
        },
        addToRefresh = function (observable) {
            if (waitForRefresh.indexOf(observable) === -1) {
                waitForRefresh.push(observable);
            }
        },
        refresher = window.ComputedRefresher = {
            refreshAll: function () {
                _.each(waitForRefresh, function (val) {
                    val.notify();
                });
                waitForRefresh = [];
            },
            startRefresh: function () {
                var self = this;
                refreshActive = true;
                refreshFn(function () {
                    if (refreshActive) {
                        self.refreshAll();
                        self.startRefresh();
                    }
                });
            },
            stopRefresh: function () {
                refreshActive = false;
            }
        }, BaseObservable;


    var hashObservers = {};

    var datasetSupported = !!document.createElement('div').dataset;

    var ObjectObservable = window.ObjectObservable = function (params) {
        params = params || {};
        this.dependencies = [];
        this.selfCallbacks = [];
        this.listeners = [];

        var initial = params.initial, $el = params.$el;
        if (params.evil) {

            var evil = ViewModel.evil(params.evil.string, params.evil.context, params.evil.addArgs);

            computedInit = this;
            var obs = evil();
            if (Observable.isObservable(obs)) {
                initial = obs();
                this.getter = function () {
                    return obs();
                };
                this.setter = function (value) {
                    obs(value);
                    return value;
                };
            } else {
                initial = obs;
                this.getter = function () {
                    return evil();
                };
            }
            computedInit = false;


        } else if (params.get) {
            computedInit = this;
            initial = params.get();
            computedInit = false;
            this.getter = params.get;
        }

        if ($el) {
            var id = (datasetSupported ? $el[0].dataset.nkObservers : $el.data('nkObservers')) || _.uniqueId('nk_observers');
            var observers = hashObservers[id] || [];
            hashObservers[id] = observers;
            observers.push(this);
            if (datasetSupported) {
                $el[0].dataset.nkObservers = id;
            } else {
                $el.data('nkObservers', id);
            }

        }

        if (params.set) {
            this.setter = params.set;
        }
        this.lastValue = this.value = initial;
        //TODO: implement dirty behavior
        this.dirty = params.dirty;
    };

    ObjectObservable.clearBinds = function (id) {
        if (!id)
            return;
        var observers = hashObservers[id], i, l;
        if (observers)
            while (observers.length) {
                observers.pop().destroy();
            }
        delete hashObservers[id];
    };

    ObjectObservable.refreshBinds = function (id) {
        if (!id)
            return;
        var observers = hashObservers[id], i, l;
        if (observers)
            for (i = 0, l = observers.length; i < l; i++) {
                observers[i].notify();
            }
        delete observers[id];
    };

    ObjectObservable.prototype = {
        setter: function (value) {
            return value;
        },
        getter: function () {
            if (computedInit) {
                computedInit.dependsOn(this);
            }
            return this.value;
        },
        set: function (value) {

            this.value = this.setter(value);
            return this.notify();
        },
        get: function () {
            return this.getter();
        },
        destroy: function () {
            var me = this;
            _.each(me.dependencies, function (obs, index) {
                obs.unsubscribe(me.selfCallbacks[index]);
            });
            me.dependencies = undefined;
            me.selfCallbacks = undefined;
            me.listeners = [];
            me.value = undefined;
            me.lastValue = undefined;

        },
        dependsOn: function (obs) {
            var me = this;

            if (me.dependencies.indexOf(obs) === -1) {
                me.dependencies.push(obs);
                var callback = function () {
                    me.notify();
                };
                me.selfCallbacks.push(callback);
                obs.subscribe(callback);
            }
            return me;
        },
        subscribe: function (callback) {
            this.listeners.push(callback);
            return this;
        },
        unsubscribe: function (callback) {
            this.listeners = _.filter(this.listeners, function (listener) {
                return listener !== callback;
            });
            return this;
        },
        notify: function () {
            var me = this,
                value = me.get();
            if (me.lastValue !== value) {
                _.each(me.listeners, function (callback) {
                    callback(value);
                });
            }
            me.lastValue = value;
            return me;
        },
        fire: function () {
            var me = this,
                value = me.get();
            _.each(me.listeners, function (callback) {
                callback(value);
            });
            return me;
        },
        callAndSubscribe: function (callback) {
            callback(this.get());
            return this.subscribe(callback);
        },
        valueOf: function () {
            return this.get();
        },
        toString: function () {
            return this.get();
        }
    };

    BaseObservable = function (params) {
        var object = new ObjectObservable(params);

        var fn = function (newValue) {
            if (arguments.length !== 0) {
                object.set(newValue);
                return newValue;
            }
            return object.get();
        };

        _.extend(fn, {
            obj: object,
            subscribe: function (callback) {
                object.subscribe(callback);
                return this;
            },
            unsubscribe: function (callback) {
                object.unsubscribe(callback);
                return this;
            },
            fire: function () {
                object.fire();
                return this;
            },
            _notSimple: true,
            __observable: true
        });
        //fn.fire = fn.notify;
        fn.valueOf = fn.toString = function () {
            return fn();
        };
        return fn;
    };
    Observable = function (initial) {
        return BaseObservable({
            initial: initial
        });
    };
    Observable.isObservable = function (fn) {
        if (typeof fn !== 'function') {
            return false;
        }
        return fn.__observable || false;
    };

    Computed = function (options, context) {
        //TODO: удалить исключение после 17.08.2013
        if (context) {
            throw Error('Context for computed is obsolete');
        }
        return BaseObservable(typeof options === 'function' ? {
            get: options
        } : options);
    };

    //window.BaseObservable = BaseObservable;
    window.Observable = Observable;
    window.Computed = Computed;
    //window.Subscribeable = Subscribeable;
}(this));

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
    /*globals Events, _, $*/
    var modelsMap = {},

        Model = Events.extend({
            constructor: function (data) {

                data = data || {};

                this.attributes = _.extend({}, this.defaults, this.parse(data));
                this._changed = {};
                this.id = this.attributes[this.idAttribute];
                this.cid = _.uniqueId('c');
                //заносим в глобальную коллекцию
                if (this.mapping && this.id) {
                    modelsMap[this.mapping] = modelsMap[this.mapping] || {};
                    modelsMap[this.mapping][this.id] = this;
                }
                this.initialize();
            },
            initialize: function () {
                return this;
            },
            idAttribute: 'id',
            mapping: false,
            defaults: {},
            toJSON: function () {
                return _.clone(this.attributes);
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
                if (arguments.length === 1 && typeof key === 'string') {
                    return this.attributes[key];
                }
                var values = {}, self = this, changed = {};
                if (typeof key === 'string') {
                    values[key] = value;
                } else {
                    values = key;
                }

                _.each(values, function (val, key) {
                    changed[key] = self._changed[key] = self.attributes[key] = val;
                    if (key === self.idAttribute) {
                        self.id = val;
                    }
                    self.fire('change:' + key);
                });
                this.fire('change', changed);
                return this;
            },
            /**
             * DEPRECATED since 26.01.2013
             */
            get: function (key) {
                return this.prop.apply(this, arguments);
            },
            /**
             * синоним для prop
             */
            set: function () {
                return this.prop.apply(this, arguments);
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


                if ( _.isFunction(this.url)) {
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
                        data: _.clone(this.attributes),
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
            this.attributes = {};
            this._changed = {};
            this.itself = new itself(this);
            this.models = [];
            this.length = 0;

            if (models) {
                this.reset(models);
            }
            this.initialize(attributes);

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
            this.add(modelsArr, 'end', !options.add);
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
        /**
         * DEPRECATED since 26.01.2013
         */
        get: function() {
            return this.getByID.apply(this, arguments);
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
                indexes[self.indexOf(model)] = index;
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


    var datasetSupported = !!document.createElement('div').dataset;

    $.fn.clearBinds = function () {
        var $self = $();
        $self.length = 1;
        this.each(function () {
            $self[0] = this;
            ObjectObservable.clearBinds(datasetSupported ? this.dataset.nkObservers : $self.data('nkObservers'));
            $self.children().clearBinds();
        });
        return this;
    };

    $.fn.refreshBinds = function () {
        var $self = $();
        $self.length = 1;
        this.each(function () {
            $self[0] = this;
            ObjectObservable.refreshBinds(datasetSupported ? this.dataset.nkObservers : $self.data('nkObservers'));
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


        var result = new ObjectObservable({
            evil: {
                string: string,
                context: context,
                addArgs: addArgs
            },
            $el: $el
        });
        return result;
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
/*globals ViewModel, $, _, Computed, Observable, ObjectObservable*/
(function() {
    "use strict";
    var filtersSplitter = /\s*\|\s*/;
    var filtersSplitter2 = /(\w+)(:['"]([^'"]+)['"])?/;

    var zeroEmpty = function(value) {
        return value || (value === 0 ? '0' : '');
    };

    ViewModel.filters = {};

    ViewModel.applyFilters = function(value, context, addArgs, callback, $el) {
        var filters = value.split(filtersSplitter);
        if (filters.length <= 1) {
            return this.findCallAndSubscribe(value, context, addArgs, callback, $el);
        }
        value = filters.shift();
        var computed = this.findObservable(value, context, addArgs, $el);
        filters = _.foldl(filters, function(result, string) {
            var matches = filtersSplitter2.exec(string);
            var key = matches[1];
            result.push({
                unformat: ViewModel.filters[key].unformat,
                format: ViewModel.filters[key].format,
                key: key,
                value: matches[3] || ''
            });
            return result;
        }, []);
        var result = new ObjectObservable({
            get: function() {
                return _.foldl(filters, function(result, obj) {
                    return obj.format.call(ViewModel, result, obj.value);
                }, computed.get());
            },
            set: function(value) {
                computed.set(_.foldr(filters, function(result, obj) {
                    return obj.unformat.call(ViewModel, result, obj.value);
                }, value));
            },
            $el: $el
        });

        if (callback) {
            callback(result.value);
            result.subscribe(callback);
        }

        return result;
    };

    ViewModel.binds = {
        log: function($el, value, context, addArgs) {
            this.findCallAndSubscribe(value, context, addArgs, function(val) {
                console.log(context, '.', value, '=', val);
            }, $el);
        },
        src: function($el, value, context, addArgs) {
            var elem = $el[0];
            this.findCallAndSubscribe(value, context, addArgs, function(val) {
                elem.src = val || '';
            }, $el);
        },
        html: function($el, value, context, addArgs) {
            this.applyFilters(value, context, addArgs, function(val) {
                $el.html(zeroEmpty(val));
            }, $el);
        },
        text: function($el, value, context, addArgs) {
            this.findCallAndSubscribe(value, context, addArgs, function(val) {
                $el.text(val);
            }, $el);
        },
        'with': function($el, value, context, addArgs) {
            return this.evil(value, context, addArgs)();
        },
        each: function($el, value, context, addArgs) {

            var template = $el.html();
            if (addArgs) {
                addArgs = _.clone(addArgs);
            }
            else {
                addArgs = {};
            }                      


            this.findCallAndSubscribe(value, context, addArgs, function(array) {
                $el.children().clearBinds();
                $el.empty();
                var fragment=document.createDocumentFragment();
                if (array) {
                    _.each(array, function(val, ind) {
                        addArgs.$index = ind;
                        addArgs.$parent = array;
                        addArgs.$value = val;
                        
                        $(template).each(function(){
                            ViewModel.findBinds(this, val, addArgs);
                            fragment.appendChild(this);
                        });                                                                                               
                    });
                    $el[0].appendChild(fragment);
                }
            }, $el);


            return false;
        },
        value: function($el, value, context, addArgs) {
            var obs = this.applyFilters(value, context, addArgs, function(val) {
                $el.val(zeroEmpty(val));
            }, $el);

            $el.on('change keyup keydown', function() {
                var val = $el.val();
                //if ($el.get() !== val) {
                    obs.set(val);
                //}
            });
        },
        attr: function($el, value, context, addArgs) {
            var elem = $el[0];
            _.each(this.parseOptionsObject(value), function(condition, attrName) {
                ViewModel.findCallAndSubscribe(condition, context, addArgs, function(val) {
                    if (val !== false && val !== undefined && val !== null) {
                        elem.setAttribute(attrName, val);
                    } else {
                        elem.removeAttribute(attrName);
                    }
                }, $el);
            });
        },
        style: function($el, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function(condition, style) {
                ViewModel.findObservable(condition, context, addArgs, $el)
                        .callAndSubscribe(function(value) {
                    $el.css(style, value);
                });
            });
        },
        css: function($el, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function(condition, className) {
                ViewModel.findObservable(condition, context, addArgs, $el)
                        .callAndSubscribe(function(value) {
                    if (value) {
                        $el.addClass(className);
                    }
                    else {
                        $el.removeClass(className);
                    }
                });
            });
        },
        display: function($el, value, context, addArgs) {
            this.findObservable(value, context, addArgs, $el).callAndSubscribe(function(value) {
                if (value) {
                    $el.show();
                }
                else {
                    $el.hide();
                }
            });
        },
        click: function($el, value, context, addArgs) {
            var fn = this.evil(value, context, addArgs, $el)();
            $el.click(function() {
                fn.apply(context, arguments);
            });
        },
        className: function($el, value, context, addArgs) {
            var oldClassName;
            this.findObservable(value, context, addArgs, $el).callAndSubscribe(function(className) {
                if (oldClassName) {
                    $el.removeClass(oldClassName);
                }
                if (className) {
                    $el.addClass(className);
                }
                oldClassName = className;
            });
        },
        events: function($el, value, context, addArgs) {
            var self = this;
            _.each(this.parseOptionsObject(value), function(expr, eventName) {
                var callback = self.evil(expr, context, addArgs)();
                $el.bind(eventName, function(e) {
                    callback.call(context, e);
                });
            });
        },
        view: function($el, value, context, addArgs) {
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
                _.forOwn(options.options, function(value, key) {
                    args[key] = ViewModel.evil(value, context, addArgs)();
                });
            }

            vm = new ViewModelClass(args);
            if (options.name) {
                context[options.name] = vm;
            }

            return false;
        },
        $click: function($el, value, context, addArgs) {
            $el.click(this.evil(value, context, addArgs));
            return false;
        }
    };
    var bindSplitter = /\s*;\s*/,
            firstColonRegex = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*$/,
            commaSplitter = /\s*,\s*/,
            dataBind = function(name, $el, value, context, addArgs) {
        $el.removeAttr(name);
        var newCtx, breakContextIsSent;
        if (value) {

            _.each(value.split(bindSplitter), function(cBind) {
                var arr = cBind.match(firstColonRegex), bindName, bindVal, bindFn;
                if (!arr) {
                    bindName = cBind;
                    bindVal = '';
                } else {
                    bindName = arr[1];
                    bindVal = arr[2];
                }

                bindName = bindName.split(commaSplitter);

                _.each(bindName, function(ccBind) {
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


    ViewModel.tag = function(tagName, behavior) {
        document.createElement(tagName);// for IE
        ViewModel.tags[tagName] = behavior;
    };
    ViewModel.removeTag = function(tagName) {
        delete ViewModel.tags[tagName];
    };
    ViewModel.tags = {};

    ViewModel.customAttributes = {
        'data-bind': function($el, value, context, addArgs) {
            return dataBind('data-bind', $el, value, context, addArgs);
        },
        'nk': function($el, value, context, addArgs) {
            return dataBind('nk', $el, value, context, addArgs);
        }
    };


    ViewModel.filters._sysUnwrap = {
        format: function(value) {
            if (Observable.isObservable(value)) {
                return value();
            }
            return value;
        }
    };

    ViewModel.filters._sysEmpty = {
        format: zeroEmpty
    };

    ViewModel.inlineModificators = {
        '{{}}': function(textNode, context, addArgs) {
            var str = textNode.nodeValue,
                    vm = this,
                    parent,
                    docFragment,
                    div,
                    nodeList = [textNode],
                    breakersRegex = ViewModel.inlineModificators['{{}}'].regex,
                    $el;
            breakersRegex.lastIndex = 0;
            if (breakersRegex.test(str)) {

                parent = textNode.parentNode;
                $el = $(parent);
                div = document.createElement('div');


                var i = 0;

                var ctx = {
                };
                breakersRegex.lastIndex = 0;

                str = '"' + str.replace(breakersRegex, function(exprWithBreakers, expr) {
                    i++;
                    ctx['___comp' + i] = vm.applyFilters(expr + ' | _sysUnwrap | _sysEmpty', context, addArgs, undefined, $el).getter;
                    return '"+___comp' + i + '()+"';
                }) + '"';


                vm.findCallAndSubscribe(str, ctx, addArgs, parent.childNodes.length === 1 ? function(value) {
                    //if this is the only child
                    try {
                        parent.innerHTML = value;
                    } catch (e) {
                        console.log(e);
                    }

                } : function(value) {

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

                }, $el);
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

    var createRow = function ($children, oModel, context, addArgs, ctx) {


        var model, newContext = {}, prop;

        addArgs.$parent = context;
        addArgs.$self = Computed({
            initial: oModel.value,
            $el: $children
        });

        addArgs.$self._oModel = oModel;
        var refresh = false;

        var cb = function (value) {
            addArgs.$self(value);
            if (model) {
                //перестает слушать старую модель
                model.off(0, 0, ctx);
            }

            if (value) {
                _.extend(newContext, value.attributes);
                //слушает новую
                value.on('change', function (changed) {
                    _.extend(newContext, changed);
                    if (!refresh) {
                        refresh = true;
                        $children.refreshBinds();
                    }
                    refresh = false;
                }, ctx);


            } else {
                for (prop in newContext) {
                    delete newContext[prop];
                }
            }

            if (!refresh) {
                refresh = true;
                $children.refreshBinds();
            }
            refresh = false;

            model = value;

        };

        cb(oModel.value);
        oModel.subscribe(cb);

        //oModel.callAndSubscribe();

        //парсит внутренний html как темплейт
        $children.each(function () {
            ViewModel.findBinds(this, newContext, addArgs);
        });


        return addArgs;
    };


    ViewModel.binds.withModel = function ($el, value, context, addArgs) {
        addArgs = addArgs || {};


        createRow($el.children(), this.findObservable(value, context, addArgs, $el), context, addArgs, {});
        //останавливает внешний парсер
        return false;
    };

    ViewModel.binds.eachModel = function ($el, value, context, addArgs) {
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
            $bufferView,
            $bufferContainer = $(document.createElement(elName)),
            args = [],
            bufferArgs,
            lastCreatedArgs;


        values = value.split(/\s*,\s*/);
        collectionName = values[0];
        templateName = values[1];


        rawTemplate = templateName ? '' : $el.html();

        //когда меняется целая коллекция
        this.findObservable(collectionName, context, addArgs, $el).callAndSubscribe(function (collection) {

            if (oldCollection) {
                oldCollection.off(0, 0, ctx);

                oldCollection.each(function (model) {
                    model.off(0, 0, ctx);
                });

            }

            oldCollection = collection;
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
                return function (model, $index, $parent) {

                    var args, $children = $(rawTemplate);


                    args = createRow($children, Computed({
                        initial: model,
                        $el: $children
                    }).obj, collection, {
                        $index: $index
                    }, ctx);

                    lastCreatedArgs = args;


                    tempChildrenLen = $children.length;
                    return $children;
                };
            };


            //template принимает модель и возвращает ее текстовое html представление
            template = templateName ? ViewModel.tmpl.get(templateName, templateConstructor) : templateConstructor(rawTemplate);


            //склеивает все представления всех моделей в коллекции
            onReset = function () {
                var html = '', i = 0;
                $el.children().clearBinds();
                $el.empty();

                args = [];

                collection.each(function (model) {
                    $el.append(template(model, i++, collection));
                    args.push(lastCreatedArgs);
                });
            };
            onReset();


            collection.on('add', function (newModels, index, lastIndex) {
                var i = 0,
                    html = '';
                var _index = lastIndex || index;

                html = $(document.createElement(elName));


                _.each(newModels, function (model) {

                    if ($bufferView) {


                        bufferArgs.$index = _index + i++;

                        bufferArgs.$self._oModel.set(model);
                        html.append($bufferView);
                        $bufferView = undefined;

                        lastCreatedArgs = bufferArgs;
                    } else {
                        html.append(template(model, _index + i++, collection));
                    }
                });

                args.splice(index, 0, lastCreatedArgs);


                html = html.children();

                if (index === 0) {

                    $el.prepend(html);
                } else if (!index || index === collection.length - newModels.length) {
                    $el.append(html);
                } else {
                    $el.children().eq(index * tempChildrenLen).before(html);
                }

            }, ctx);

            collection.on('reset', onReset, ctx);
            collection.on('cut', function (rejectedModels) {

                var $children = $el.children(), index, model, $slice;

                for (index in rejectedModels) {
                    model = rejectedModels[index];

                    model.off(0, 0, ctx);
                    $slice = $children.slice(index, index + tempChildrenLen);
                    if (!$bufferView) {
                        $bufferView = $slice;
                        $bufferContainer.append($bufferView);
                        bufferArgs = args[index];
                    } else {
                        $slice.clearBinds().empty().remove();
                    }

                    args.splice(index, 1);


                }

            }, ctx);
            collection.on('sort', function (indexes) {
                var $tempDiv = $(document.createElement('div')),
                    $children = $el.children();

                _.each(indexes, function (newIndex, oldIndex) {
                    oldIndex *= 1;
                    $tempDiv.append($children.slice(oldIndex, oldIndex + tempChildrenLen));
                });
                $el.append($tempDiv.children());
            }, ctx);
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
