(function (window) {
    "use strict";
    /*globals Events, _, $*/
    var modelsMap = {},

        Model = Events.extend({
            setComputed: function (names) {

                var self = this;
                _.each(names, function (name) {
                    var comp = self.computed[name];
                    var getter = comp.get, vals = _.foldl(comp.deps, function (array, name) {
                        array.push(self.prop(name));
                        return array;
                    }, []);
                    comp.value = getter.apply(self, vals);
                    self.fire('change:' + name);
                });
            },
            constructor: function (data) {

                var self = this;


                data = data || {};

                self.attributes = _.extend({}, self.defaults, self.parse(data));

                var rdps = self.reverseComputedDeps = {}, computedNames = [];

                _.each(self.computed, function (comp, compName) {
                    computedNames.push(compName);
                    _.each(comp.deps, function (name) {
                        if (!rdps[name]) {
                            rdps[name] = [];
                        }
                        rdps[name].push(compName);
                    });
                });

                self.setComputed(computedNames);

                self._changed = {};
                self.id = self.attributes[self.idAttribute];
                self.cid = _.uniqueId('c');
                //заносим в глобальную коллекцию
                if (self.mapping && self.id) {
                    modelsMap[self.mapping] = modelsMap[self.mapping] || {};
                    modelsMap[self.mapping][self.id] = self;
                }
                self.initialize();
            },
            initialize: function () {
                return this;
            },
            idAttribute: 'id',
            mapping: false,
            computed: {},
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
                var self = this, comp;

                //if set
                if (arguments.length === 1 && typeof key === 'string') {

                    //if computed
                    if (comp = self.computed[key]) {
                        return comp.value;
                    }
                    //if attribute
                    return self.attributes[key];
                }

                //if get
                var values = {}, changed = {};
                if (typeof key === 'string') {
                    values[key] = value;
                } else {
                    values = key;
                }

                _.each(values, function (val, key) {
                    changed[key] = self._changed[key] = val;

                    if (comp = self.computed[key]) {
                        comp.set.call(self, val);
                    } else {
                        self.attributes[key] = val;
                    }

                    if (self.reverseComputedDeps[key]) {
                        self.setComputed(self.reverseComputedDeps[key]);
                    }
                    if (key === self.idAttribute) {
                        self.id = val;
                    }
                    self.fire('change:' + key);
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
