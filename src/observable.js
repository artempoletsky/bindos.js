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


    var ObjectObservable = window.ObjectObservable = function (params) {
        params = params || {};
        this.dependencies = [];
        this.selfCallbacks = [];
        this.listeners = [];

        var initial = params.initial, $el = params.$el;
        var me = this;
        if (params.model) {
            me.prop = params.prop;
            me.model = params.model;
            me.set(params.model.prop(params.prop));
            params.model.on('change:' + params.prop, function () {
                var val = params.model.prop(params.prop);
                if (val != me.value) {
                    me.set(val);
                }
            }, me);
        } else if (params.evil) {

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
            var id = $el.data('nkObservers') || _.uniqueId('nk_observers');
            var observers = hashObservers[id] || [];
            hashObservers[id] = observers;
            observers.push(this);

            $el.data('nkObservers', id);

        }

        if (params.set) {
            this.setter = params.set;
        }
        this.lastValue = this.value = initial;
        //TODO: implement dirty behavior
        this.dirty = params.dirty;
    };

    ObjectObservable.clearBinds = function (id) {
        if (!id) {
            return;
        }
        var observers = hashObservers[id], i, l;
        if (observers) {
            while (observers.length) {
                observers.pop().destroy();
            }
        }
        delete hashObservers[id];
    };

    ObjectObservable.refreshBinds = function (id) {
        if (!id) {
            return;
        }
        var observers = hashObservers[id], i, l;
        if (observers) {
            for (i = 0, l = observers.length; i < l; i++) {
                observers[i].notify();
            }
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

            if (this.model) {
                this.model.prop(this.prop, this.value);
            }
            return this.notify();
        },
        get: function () {
            return this.getter();
        },
        destroy: function () {
            var me = this;

            if (me.model) {
                me.model.off(0, 0, this);
                me.model = undefined;
            }
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
    Observable = function (modelInitial, prop) {
        if (prop) {
            return BaseObservable({
                model: modelInitial,
                prop: prop
            });
        }
        return BaseObservable({
            initial: modelInitial
        });
    };
    Observable.isObservable = function (fn) {
        if (typeof fn !== 'function') {
            return false;
        }
        return fn.__observable || false;
    };

    Computed = function (options, context) {
        return BaseObservable(typeof options === 'function' ? {
            get: options
        } : options);
    };

    //window.BaseObservable = BaseObservable;
    window.Observable = Observable;
    window.Computed = Computed;
    //window.Subscribeable = Subscribeable;
}(this));
