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
                bind = makeBind(event, fn, context),
                bindsArrayIndex,
                bindsArray,
                l,
                i, bindObject, compared, ns2;
            if (!mode) {
                mode = 'filter';
            }

            for (bindsArrayIndex in binds) {
                bindsArray = binds[bindsArrayIndex];

                for (i = 0, l = bindsArray.length; i < l; i++) {
                    bindObject = bindsArray[i];
                    compared = (!bind.fn || bind.fn === bindObject.fn)
                        && (!bind.n || bind.n === bindObject.n)
                        && (!bind.c || bind.c === bindObject.c);
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
                            break;
                        }
                    } else if (mode === 'invert') {
                        result.push(bindObject);
                    }
                }
                if (result === true) {
                    break;
                }
            }


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
                    ctx,
                    eventNames,
                    i,
                    l, event_name;
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
                    add(self, makeBind(eventNames[i], fn, context, callOnce));
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
                    me = this, i, l, eventNames, foundBinds, j, k, bind;

                eventNames = events.split(eventSplitter);
                for (i = 0, l = eventNames.length; i < l; i++) {
                    foundBinds = findBinds(me._listeners, eventNames[i], false, false);

                    for (j = 0, k = foundBinds.length; j < k; j++) {
                        bind = foundBinds[j];
                        //если забинден через one  удаляем
                        if (bind.s) {
                            me.off(0, bind.fn);
                        }
                        bind.fn.apply(bind.c, args);
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