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


    var ObjectObservable = function (params) {
        params = params || {};
        this.dependencies = [];
        this.selfCallbacks = [];
        this.listeners = [];

        var initial = params.initial;
        if (params.get) {
            computedInit = this;
            initial = params.get();
            computedInit = false;
            this.getter = params.get;
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
                return listener === callback;
            });
            return this;
        },
        notify: function () {
            var me = this,
                value = me.get();
            if (me.lastValue !== value || _.isObject(value)) {
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
            if (me.lastValue !== value || _.isObject(value)) {
                _.each(me.listeners, function (callback) {
                    callback(value);
                });
            }
            return me;
        },
        callAndSubscribe: function (callback) {
            callback(this.get());
            return this.subscribe(callback);
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
