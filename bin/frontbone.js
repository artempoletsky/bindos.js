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
            var observers = $el.data('nk_observers');
            observers = observers || [];
            observers.push(this);
            $el.data('nk_observers', observers);
        }

        if (params.set) {
            this.setter = params.set;
        }
        this.lastValue = this.value = initial;
        //TODO: implement dirty behavior
        this.dirty = params.dirty;
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
            event = String(event);
            var arr = event.split(namespaceSplitter);
            return {
                c: context,
                s: isSignal,
                fn: fn,
                n: arr[0],
                ns: arr.slice(1),
                o: event
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


        findBinds = function (binds, event, fn, context, mode) {
            var result = mode === 'any' ? false : [],
                bind = makeBind(event, fn, context);
            if (!mode) {
                mode = 'filter';
            }

            _.each(binds, function (bindsArray) {
                _.each(bindsArray, function (bindObject) {
                    var compared = (!bind.fn || bind.fn === bindObject.fn)
                        && (!bind.n || bind.n === bindObject.n)
                        && (!bind.c || bind.c === bindObject.c), ns2;
                    //сравнивает пространсва имен
                    if (compared && bind.ns.length) {
                        ns2 = bindObject.ns;
                        compared = !_.any(bind.ns, function (val) {
                            return ns2.indexOf(val);
                        });
                    }

                    if (compared) {
                        if (mode === 'filter') {
                            result.push(bindObject);
                        } else if (mode === 'any') {
                            result = true;
                            return false;
                        }
                    } else if (mode === 'invert') {
                        result.push(bindObject);
                    }


                });
                if (result === true) {
                    return false;
                }
            });

            return result;
        },

        remove = function (me, event, fn, context) {
            var bind, binds, i;
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

            binds = findBinds(me._listeners, event, fn, context, 'invert');

            delete me._listeners;
            for (i = binds.length - 1; i >= 0; i--) {
                add(me, binds[i]);
            }
        },
        Events = Class.extend({
            on: function (events, fn, context, callOnce) {
                var self = this,
                    ctx;
                if (_.isObject(events)) {
                    ctx = fn || self;
                    _.each(events, function (callback, event_name) {
                        self.on(event_name, callback, ctx, callOnce);
                    });
                    return this;
                }

                if (typeof fn !== 'function') {
                    throw TypeError('function expected');
                }

                if (!context) {
                    context = this;
                }
                _.each(events.split(eventSplitter), function (event) {
                    add(self, makeBind(event, fn, context, callOnce));
                });

                return self;
            },
            off: function (events, fn, context) {
                var me = this;
                if (!events) {
                    remove(me, '', fn, context);
                    return me;
                }
                _.each(events.split(eventSplitter), function (name) {
                    remove(me, name, fn, context);
                });
                return me;
            },
            fire: function (events) {
                if (!this._listeners) {
                    return this;
                }
                //все кроме events передается аргументами в каждый колбек
                var args = _.rest(arguments, 1),
                    me = this;
                _.each(events.split(eventSplitter), function (type) {

                    _.each(findBinds(me._listeners, type, false, false), function (bind) {
                        //если забинден через one  удаляем
                        if (bind.s) {
                            me.off(0, bind.fn);
                        }
                        bind.fn.apply(bind.c, args);
                    });
                });
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
                return true;
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

                Model.sync('read', this.url(), _.extend({}, options, opt));
                return this;
            },
            save: function () {
                var me = this;
                if (!this.validate()) {
                    throw new Error('Model is invalid');
                }
                if (this.id) {

                    if (_.keys(me._changed).length === 0) {//нечего сохранять
                        return this;
                    }
                    Model.sync('update', this.url(), {
                        data: me._changed,
                        success: function (data) {
                            me.update(data);
                        }
                    });
                } else {
                    Model.sync('create', this.url(), {
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

(function (window) {
    "use strict";
    /*globals _,$, Model*/
    var itself = function (self) {
            this.self = self;
        },
        Collection = Model.extend({

            constructor: function (models, attributes) {
                this.attributes={};
                this._changed={};
                this.itself = new itself(this);
                this.models = [];
                this.length = 0;

                // хэш вида  id : глобальный индекс
                this._hashId = [];
                if (models) {
                    this.reset(models);
                }
                this.initialize(attributes);

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
                    this.fire('beforeReset', this.models);
                    this.models = [];
                    this.length = 0;
                    this._hashId = [];
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
            push: function (model) {
                return this.add(model);
            },
            unshift: function (model) {
                return this.add(model, 0);
            },
            add: function (models, index, silent) {

                var me = this,
                    hashIndex,
                    addedModels = [],
                    _models,
                    _index = 0;

                if (!(models instanceof Array)) {
                    models = [models];
                }

                if (typeof index !== 'number') {
                    index = this.length;
                    _index = this.getIndex(this.models[this.length - 1]);
                } else if (index === 0) {
                    _models = _.clone(models).reverse();
                    _index = this.getIndex(this.models[0]) - _models.length - 1;
                }


                function addHashIndex(model, index) {
                    if (index === 0 && me.length) {
                        // берем наименьший порядковый индекс из первого элемента хэша
                        hashIndex = me._hashId[0].index - 1;
                        // добавляем элемент в начало хэша
                        me._hashId.unshift({
                            id: model.id,
                            index: hashIndex
                        });
                    }
                    else {
                        var length = me._hashId.length;
                        // проверка для пустого хэша
                        if (length === 0) {
                            hashIndex = 1;
                        }
                        else {
                            // берем порядковый индекс из последнего элемента в хэше
                            hashIndex = me._hashId[length - 1].index + 1;
                        }
                        // добавляем элемент в конец хэша
                        me._hashId.push({
                            id: model.id,
                            index: hashIndex
                        });
                    }
                }

                _.each(models, function (model, ind) {
                    if (!(model instanceof Model)) {
                        model = Model.createOrUpdate(me.model, model);
                    }
                    addedModels.push(model);

                    if (_models) {
                        addHashIndex(_models[ind], 0);
                    } else {
                        addHashIndex(model, (index + ind));
                    }

                    model.one('remove', function () {
                        me.cutByCid(this.cid);
                    });

                    me.models.splice(index + ind, 0, model);

                });

                this.length = this.models.length;
                if (!silent) {
                    this.fire('add', addedModels, index, _index);
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

                var model = this.models.splice(index, 1)[0], cutted;
                // удаление элемента из хеша
                this._hashId.splice(index, 1);
                this.length = this.models.length;
                cutted = {};
                cutted[index] = model;
                this.fire('cut', cutted);
                return model;
            },
            at: function (index) {
                return this.models[index];
            },
            /**
             * DEPRECATED since 26.01.2013
             */
            get: function () {
                return this.getByID.apply(this, arguments);
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
            },
            /**
             * Возвращение порядкового индекса модели
             * во всей коллекции
             * @param model
             * @return {Number}
             */
            getIndex: function (model) {
                if (!model) {
                    return 0;
                }
                var i = this.indexOf(model);
                return this._hashId[i].index;
            }
        }),

    // Underscore methods that we want to implement on the Collection.
        methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find','foldl','foldr',
            'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
            'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortByDesc', 'sortedIndex',
            'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
            'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'],

    // An internal function to generate lookup iterators.
        lookupIterator = function (value) {
            return _.isFunction(value) ? value : function (obj) {
                return obj[value];
            };
        },
        filterMethods = ['filter', 'reject'],
        sortMethods = ['sortBy', 'sortByDesc', 'shuffle'];

    // Sort the object's values by a criterion produced by an iterator.
    _.sortByDesc = function (obj, value, context) {
        var iterator = lookupIterator(value);
        return _.pluck(_.map(obj,function (value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iterator.call(context, value, index, list)
            };
        }).sort(function (left, right) {
                var a = left.criteria,
                    b = right.criteria;
                if (a !== b) {
                    if (a > b || a === undefined) {
                        return -1;
                    }
                    if (a < b || b === undefined) {
                        return 1;
                    }
                }
                return left.index < right.index ? -1 : 1;
            }), 'value');
    };


    // Mix in each Underscore method as a proxy to `Collection#models`.
    _.each(methods, function (method) {
        Collection.prototype[method] = function () {
            return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
        };
    });


    _.each(filterMethods, function (method) {
        itself.prototype[method] = function () {
            var antonym = method === 'filter' ? 'reject' : 'filter',
                self = this.self,
                args = _.toArray(arguments),
                newModels = _[method].apply(_, [self.models].concat(args)),
                rejectedModels = _[antonym].apply(_, [self.models].concat(args)),
                indexes = {};
            _.each(rejectedModels, function (model) {
                indexes[self.indexOf(model)] = model;
            });
            self.models = newModels;
            self.length = newModels.length;
            self.fire('cut', indexes);
            return self;
        };
    });

    _.each(sortMethods, function (method) {
        itself.prototype[method] = function () {
            var self = this.self,
                newModels = _[method].apply(_, [self.models].concat(_.toArray(arguments))),
                indexes = {};
            _.each(newModels, function (model, index) {
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

    $.fn.clearBinds = function () {
        var $self = $();
        $self.length = 1;
        this.each(function () {
            $self[0] = this;
            _.each($self.data('nk_observers'), function (obs) {
                obs.destroy();
            });
            $self.data('nk_observers', []);
            $self.children().clearBinds();
        });
        return this;
    };

    $.fn.refreshBinds = function () {
        var $self = $();
        $self.length = 1;
        this.each(function () {
            $self[0] = this;
            _.each($self.data('nk_observers'), function (obs) {
                obs.notify();
            });
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
(function () {
    "use strict";
    var filtersSplitter = /\s*\|\s*/;
    var filtersSplitter2 = /(\w+)(:['"]([^'"]+)['"])?/;

    ViewModel.filters = {};

    ViewModel.applyFilters = function (value, context, addArgs, callback, $el) {
        var filters = value.split(filtersSplitter);
        if (filters.length <= 1) {
            return this.findCallAndSubscribe(value, context, addArgs, callback, $el);
        }
        value = filters.shift();
        var computed = this.findObservable(value, context, addArgs, $el);
        filters = _.foldl(filters, function (result, string) {
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
            get: function () {
                return _.foldl(filters, function (result, obj) {
                    return obj.format.call(ViewModel, result, obj.value);
                }, computed.get());
            },
            set: function (value) {
                computed.set(_.foldr(filters, function (result, obj) {
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
        log: function ($el, value, context, addArgs) {
            this.findCallAndSubscribe(value, context, addArgs, function (val) {
                console.log(context, '.', value, '=', val);
            }, $el);
        },
        src: function ($el, value, context, addArgs) {
            var elem = $el[0];
            this.findCallAndSubscribe(value, context, addArgs, function (val) {
                elem.src = val || '';
            }, $el);
        },
        html: function ($el, value, context, addArgs) {
            this.applyFilters(value, context, addArgs, function (val) {
                //undefined конвертируется в пустую строку
                if (!val && typeof val != 'number') {
                    val = '';
                }
                $el.html(val);
            }, $el);
        },
        text: function ($el, value, context, addArgs) {
            this.findCallAndSubscribe(value, context, addArgs, function (val) {
                $el.text(val);
            }, $el);
        },
        'with': function ($el, value, context, addArgs) {
            return this.evil(value, context, addArgs)();
        },
        each: function ($el, value, context, addArgs) {

            var html = $el.html();
            if (addArgs) {
                addArgs = _.clone(addArgs);
            }
            else {
                addArgs = {};
            }

            this.findCallAndSubscribe(value, context, addArgs, function (array) {
                $el.children().clearBinds();
                $el.empty();

                if (array) {
                    _.each(array, function (val, ind) {
                        addArgs.$index = ind;
                        addArgs.$parent = array;
                        addArgs.$value = val;
                        var tempDiv = document.createElement('div');
                        try {
                            tempDiv.innerHTML = html;
                        } catch (e) {
                            console.log(e);
                        }
                        ViewModel.findBinds(tempDiv, val, addArgs);
                        $el.append($(tempDiv).children());
                    });
                }
            }, $el);


            return false;
        },
        value: function ($el, value, context, addArgs) {
            var obs = this.findObservable(value, context, addArgs, $el)
                .callAndSubscribe(function (value) {
                    $el.val(value);
                });
            $el.change(function () {
                obs($el.val());
            });
        },
        attr: function ($el, value, context, addArgs) {
            var elem = $el[0];
            _.each(this.parseOptionsObject(value), function (condition, attrName) {
                ViewModel.findCallAndSubscribe(condition, context, addArgs, function (val) {
                    if (val !== false && val !== undefined && val != null) {
                        elem.setAttribute(attrName, val);
                    } else {
                        elem.removeAttribute(attrName);
                    }
                }, $el);
            });
        },
        style: function ($el, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function (condition, style) {
                ViewModel.findObservable(condition, context, addArgs, $el)
                    .callAndSubscribe(function (value) {
                        $el.css(style, value);
                    });
            });
        },
        css: function ($el, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function (condition, className) {
                ViewModel.findObservable(condition, context, addArgs, $el)
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
        display: function ($el, value, context, addArgs) {
            this.findObservable(value, context, addArgs, $el).callAndSubscribe(function (value) {
                if (value) {
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
        className: function ($el, value, context, addArgs) {
            var oldClassName;
            this.findObservable(value, context, addArgs, $el).callAndSubscribe(function (className) {
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


    ViewModel.filters._sysUnwrap = {
        format: function (value) {
            if (Observable.isObservable(value)) {
                return value();
            }
            return value;
        }
    };

    ViewModel.filters._sysEmpty = {
        format: function (value) {
            return value || (value === 0 ? '0' : '');
        }
    };

    ViewModel.inlineModificators = {
        '{{}}': function (textNode, context, addArgs) {
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
                $el=$(parent);
                div = document.createElement('div');


                var i = 0;

                var ctx = {

                };
                breakersRegex.lastIndex = 0;

                str = '"' + str.replace(breakersRegex, function (exprWithBreakers, expr) {
                    i++;
                    ctx['___comp' + i] = vm.applyFilters(expr + ' | _sysUnwrap | _sysEmpty', context, addArgs, undefined, $el).getter;
                    return '"+___comp' + i + '()+"';
                }) + '"';


                vm.findCallAndSubscribe(str, ctx, addArgs, parent.childNodes.length == 1 ? function (value) {
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
                        firstNode.textContent = '';
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
                    $children.refreshBinds();
                }, ctx);


            } else {
                for (prop in newContext) {
                    delete newContext[prop];
                }
            }
            $children.refreshBinds();
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
            elName = elem.tagName.toLowerCase();


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

                    var args, $children, tempDiv = document.createElement(elName);

                    try {
                        tempDiv.innerHTML = rawTemplate;
                    } catch (e) {
                        console.log(e);
                    }

                    $children = $(tempDiv).children();

                    args = createRow($children, Computed({
                        initial: model,
                        $el: $children
                    }).obj, collection, {
                        $index: $index
                    }, ctx);

                    tempChildrenLen = $children.length;
                    return $children;
                };
            };


            //template принимает модель и возвращает ее текстовое html представление
            template = templateName ? ViewModel.tmpl.get(templateName, templateConstructor) : templateConstructor(rawTemplate);


            //склеивает все представления всех моделей в коллекции
            onReset = function () {
                var i = collection.getIndex(collection.at(0)) - 1,
                    html = '';
                $el.children().clearBinds();
                $el.empty();

                if (i < 0) {
                    i = 0;
                }

                collection.each(function (model) {
                    $el.append(template(model, i++, collection));
                });
            };
            onReset();

            collection.on('add', function (newModels, index, lastIndex) {
                var i = 0,
                    html = '';
                var _index = lastIndex || index;


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


            collection.on('beforeReset', function (models) {
                _.each(models, function (model) {
                    model.off(0, 0, ctx);
                });
            }, ctx);

            collection.on('reset', onReset, ctx);
            collection.on('cut', function (rejectedModels) {

                var $children = $el.children();

                _.each(rejectedModels, function (model, index) {
                    index *= 1;
                    model.off(0, 0, ctx);
                    $children.slice(index, index + tempChildrenLen).clearBinds().empty().remove();
                });
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


