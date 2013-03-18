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

    refresher.startRefresh();

    BaseObservable = function (params) {
        params = params || {};
        var value = params.initial,
            getter = params.get,
            setter = params.set,
            ctx = params.context,
            async = params.async,
            dependencies = [],
            listeners = [],
            fn = function (newValue) {
                if (arguments.length === 0) {
                    if (getter) {
                        value = getter.call(ctx);
                    } else if (computedInit) {
                        computedInit.dependsOn(fn);
                    }
                } else {
                    if (value !== newValue || _.isObject(newValue)) {
                        if (setter) {
                            setter.call(ctx, newValue);
                        } else if (getter) {
                            throw new Error('Setter for computed is not defined');
                        } else {
                            value = newValue;
                        }
                        if (!async) {
                            fn.notify();
                        } else {
                            addToRefresh(fn);
                        }
                    }
                }
                return value;
            };
        _.extend(fn, {
            dependsOn: function (obs) {
                var me = this;
                if (dependencies.indexOf(obs) === -1) {
                    dependencies.push(obs);
                    obs.subscribe(function () {
                        if (!async) {
                            fn.notify();
                        } else {
                            addToRefresh(fn);
                        }
                    });
                }
                return me;
            },
            subscribe: function (callback) {
                listeners.push(callback);
                return this;
            },
            unsubscribe: function (callback) {
                listeners = _.filter(listeners, function (listener) {
                    return listener === callback;
                });
                return this;
            },
            notify: function () {
                var me = this,
                    value = me();
                if (me.lastValue !== value || _.isObject(value)) {
                    _.each(listeners, function (callback) {
                        callback.call(me, value);
                    });
                }
                me.lastValue = value;
                return me;
            },
            fire: function () {
                var me = this,
                    value = me();
                _.each(listeners, function (callback) {
                    callback.call(me, value);
                });
                return me;
            },
            callAndSubscribe: function (callback) {
                callback.call(this, this());
                this.subscribe(callback);
                return this;
            },
            _notSimple: true,
            __observable: true
        });
        //fn.fire = fn.notify;
        fn.valueOf = fn.toString = function () {
            return this();
        };
        if (getter) {
            computedInit = fn;
            value = getter.call(ctx);
            computedInit = false;
        }
        fn.lastValue = value;
        delete fn.dependsOn;
        dependencies = undefined;
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

    Computed = function (getter, context, async, setter) {
        return BaseObservable(typeof getter === 'function' ? {
            get: getter,
            context: context,
            set: setter,
            async: async
        } : getter);
    };

    window.BaseObservable = BaseObservable;
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
        _.each(props, function (val, key) {
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
					index = this.getIndex(this.models[this.length-1]);
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
                var found, me=this;
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
				if(!model) return 0;
                var i = this.indexOf(model);
                return this._hashId[i].index;
            }
        }),

    // Underscore methods that we want to implement on the Collection.
        methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
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
(function () {
    "use strict";
    /*globals ViewModel, $, _*/
    ViewModel.binds = {
        log: function (elem, value, context, addArgs) {
            this.findObservable(context, value, addArgs).callAndSubscribe(function () {
                console.log(context, '.', value, '=', this());
            });
        },
        src: function (elem, value, context, addArgs) {
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    elem.src = val || '';
                });
        },
        html: function (elem, value, context, addArgs) {
            //var $el=$(elem);
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    //undefined конвертируется в пустую строку
                    if (!val) {
                        val = '';
                    }
                    elem.innerHTML = val;
                });
        },
        text: function (elem, value, context, addArgs) {
            var $el = $(elem);
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    $el.text(val);
                });
        },
        'with': function (elem, value, context, addArgs) {
            return this.findObservable(context, value, addArgs)();
        },
        each: function (elem, value, context, addArgs) {
            var fArray = this.findObservable(context, value, addArgs),
                $el = $(elem),
                html = $el.html();
            $el.empty();

            if (addArgs) {
                addArgs = _.clone(addArgs);
            }
            else {
                addArgs = {};
            }
            fArray.callAndSubscribe(function (array) {
                $el.empty();
                if (array) {
                    _.each(array, function (val, ind) {
                        addArgs.$index = ind;
                        addArgs.$parent = array;
                        addArgs.$value = val;
                        var tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        ViewModel.findBinds(tempDiv, val, addArgs);
                        $el.append(tempDiv.innerHTML);
                    });
                }
            });

            return false;
        },
        value: function (elem, value, context, addArgs) {
            var $el = $(elem),
                obs = this.findObservable(context, value, addArgs)
                    .callAndSubscribe(function (value) {
                        $el.val(value);
                    });
            $el.change(function () {
                obs($el.val());
            });
        },
        attr: function (elem, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function (condition, attrName) {
                ViewModel.findObservable(context, condition, addArgs)
                    .callAndSubscribe(function (val) {
                        if (val !== false && val !== undefined && val != null) {
                            elem.setAttribute(attrName, val);
                        } else {
                            elem.removeAttribute(attrName);
                        }
                    });
            });
        },
        style: function (elem, value, context, addArgs) {
            var $el = $(elem);
            _.each(this.parseOptionsObject(value), function (condition, style) {
                ViewModel.findObservable(context, condition, addArgs)
                    .callAndSubscribe(function (value) {
                        $el.css(style, value);
                    });
            });
        },
        css: function (elem, value, context, addArgs) {
            var $el = $(elem);
            _.each(this.parseOptionsObject(value), function (condition, className) {
                ViewModel.findObservable(context, condition, addArgs)
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
        display: function (elem, value, context, addArgs) {
            var $el = $(elem);
            this.findObservable(context, value, addArgs).callAndSubscribe(function (value) {
                if (value) {
                    $el.show();
                }
                else {
                    $el.hide();
                }
            });
        },
        click: function (elem, value, context, addArgs) {
            var fn = this.findObservable(context, value, addArgs)(),
                $el = $(elem);
            $el.click(function () {
                fn.apply(context, arguments);
            });
        }
    };
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
                if (!rawTemplate) {
                    throw  new Error('Raw tempalte: "' + rawTemplateName + '" is not defined');
                }
                compiledTemplates[rawTemplateName] = template = constructorFunction(rawTemplate);
            }
            return template;
        }
    };

    ViewModel.binds.template = function (elem, value) {
        var $el = $(elem);
        rawTemplates[value] = $el.html();
        $el.remove();
        return false;
    };

}());
(function () {
    "use strict";
    /*globals ViewModel, BaseObservable, _, $*/

    var createRow = function ($children, oModel, context, addArgs, ctx) {
            if (!oModel()) {
                throw new Error("Model for withModel must not be empty");
            }

            var oldCompAsync, model, newContext = {};

            _.each(oModel().toJSON(), function (value, key) {
                newContext[key] = BaseObservable({
                    initial: value
                });
            });

            _.extend(addArgs, {
                $self: oModel,
                $parent: BaseObservable({
                    initial: context
                })
            });

            oModel.callAndSubscribe(function (value) {
                if (model) {
                    //перестает слушать старую модель
                    model.off(0, 0, ctx);
                }

                if (value) {

                    //слушает новую
                    value.on('change', function (changed) {
                        _.each(changed, function (val, key) {
                            if (newContext[key]) {
                                newContext[key](val);
                            }
                        });
                    }, ctx);

                    //обновляет все obserbavles при смене модели
                    _.each(newContext, function (obs, key) {
                        newContext[key](value.attributes[key]);
                    });
                } else {
                    //обнуляет все observables
                    _.each(newContext, function (obs) {
                        obs('');
                    });
                }
                model = value;

            });

            oldCompAsync = ViewModel.compAsync;
            ViewModel.compAsync = false;
            //парсит внутренний html как темплейт
            $children.each(function () {
                ViewModel.findBinds(this, newContext, addArgs);
            });
            ViewModel.compAsync = oldCompAsync;
            return addArgs;
        },
        cloneRow = function (ctx, rawTemplate, elName, model, collection, index) {
            var args, $children, tempDiv = document.createElement(elName);
            tempDiv.innerHTML = rawTemplate;
            $children = $(tempDiv).children();

            args = createRow($children, BaseObservable({
                initial: model
            }), collection, {
                $index: BaseObservable({
                    initial: index
                })
            }, ctx);

            return {
                $children: $children,
                tempDiv: tempDiv,
                args: args
            };
        },
        listenModel = function ($el, tempChildrenLen, template, collection, ctx, model) {
            model.on('change', function () {
                var index = collection.indexOf(model),
                    $children = $el.children();

                $children.slice(index, index + tempChildrenLen).empty().remove();
                $children.eq((index - 1) * tempChildrenLen).after(template(model, index, collection));
            }, ctx);
        };

    ViewModel.binds.withModel = function (elem, value, context, addArgs) {
        addArgs = addArgs || {};
        //$children, oModel, context, addArgs, ctx
        createRow($(elem).children(), this.findObservable(context, value, addArgs), context, addArgs, {});
        //останавливает внешний парсер
        return false;
    };

    ViewModel.binds.eachModel = function (elem, value, context, addArgs) {
        var options,
            values,
            $el = $(elem),
        //заглушка чтобы быстро делать off
            ctx = {},
            oldCollection,
            rawTemplate,
            elName = elem.tagName.toLowerCase();
        try {
            options = this.parseOptionsObject(value);
        } catch (exception) {

        }
        //если в value не объект, а массив значений
        if (!options) {
            values = value.split(/\s*,\s*/);
            options = {};
            options.collection = values[0];
            options.templateName = values[1];
        }

        rawTemplate = options.templateName ? '' : $el.html();

        //когда меняется целая коллекция
        this.findObservable(context, options.collection, addArgs).callAndSubscribe(function (collection) {

            if (oldCollection) {
                oldCollection.off(0, 0, ctx);
                if (options.listenModels) {
                    oldCollection.each(function (model) {
                        model.off(0, 0, ctx);
                    });
                }
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

            if (options.innerBinds) {
                templateConstructor = function (rawTemplate) {
                    return function (model, $index, $parent) {
                        var $children = cloneRow(ctx, rawTemplate, elName, model, $parent, $index).$children;
                        tempChildrenLen = $children.length;
                        return $children;
                    };
                };
            }
            else {
                templateConstructor = function (rawTemplate) {
                    var obj = cloneRow(ctx, rawTemplate, elName, new collection.model(), collection, undefined),
                        tempDiv = obj.tempDiv,
                        args = obj.args;
                    tempChildrenLen = obj.$children.length;

                    return function (model, $index, $parent) {
                        args.$self(model);
                        args.$index($index);
                        args.$parent($parent);
                        return tempDiv.innerHTML;
                    };
                };
            }

            //template принимает модель и возвращает ее текстовое html представление
            template = options.templateName ? ViewModel.tmpl.get(options.templateName, templateConstructor) : templateConstructor(rawTemplate);


            //склеивает все представления всех моделей в коллекции
            onReset = function () {
                var i = 0,
                    html = '';
                $el.empty();


                if (options.innerBinds) {
                    collection.each(function (model) {
                        $el.append(template(model, i++, collection));
                    });
                }
                else {
                    collection.each(function (model) {
                        html += template(model, i++, collection);
                        if (options.listenModels) {
                            listenModel($el, tempChildrenLen, template, collection, ctx, model);
                        }
                    });
                    $el.html(html);
                }

            };
            onReset();

            collection.on('add', function (newModels, index, lastIndex) {
                var i = 0,
                    html = '';
                var _index = lastIndex || index;
                if (options.innerBinds) {
                    html = $(document.createElement(elName));
                    _.each(newModels, function (model) {
                        html.append(template(model, _index + i++, collection));
                    });
                    html = html.children();
                } else {
                    //склеивает все новые представления всех новых моделей в коллекции
                    _.each(newModels, function (model) {
                        html += template(model, _index + i++, collection);
                        if (options.listenModels) {
                            listenModel($el, tempChildrenLen, template, collection, ctx, model);
                        }
                    });
                }
                if (index === 0) {
                    $el.prepend(html);
                } else if (!index || index === collection.length - newModels.length) {
                    $el.append(html);
                } else {
                    $el.children().eq(index * tempChildrenLen).before(html);
                }
            }, ctx);
            if (options.listenModels) {
                collection.on('beforeReset', function (models) {
                    _.each(models, function (model) {
                        model.off(0, 0, ctx);
                    });
                }, ctx);
            }
            collection.on('reset', onReset, ctx);
            collection.on('cut', function (rejectedModels) {

                var $children = $el.children();

                _.each(rejectedModels, function (model, index) {
                    index *= 1;
                    model.off(0, 0, ctx);
                    $children.slice(index, index + tempChildrenLen).empty().remove();
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
    //deprecated since 07.03.13
    ViewModel.binds.eachModelLight = ViewModel.binds.eachModel;
}());


