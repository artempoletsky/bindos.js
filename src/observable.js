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
