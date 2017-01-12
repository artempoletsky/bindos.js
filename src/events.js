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
