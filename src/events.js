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