(function (window) {
    "use strict";


    var modelsMap = {},

        Model = Events.extend({
            reverseComputedDeps: {},
            setComputeds: function (names) {
                var self = this;
                _.each(names, function (name) {
                    var val = self._computeds[name].get();
                    self.fire('change:' + name, val);
                });
            },
            addComputed: function (name, options) {
                options.name = name;
                options.model = this;
                this._computeds[name] = new Model.Computed(options);
            },
            removeComputed: function (name) {
                var self = this;
                delete self._computeds[name];
                _.each(self.reverseComputedDeps, function (deps, key) {
                    self.reverseComputedDeps[key] = _.without(deps, name);
                });
            },
            constructor: function (data) {

                var self = this;


                data = data || {};

                self.attributes = _.extend({}, self.defaults, self.parse(data));

                this.reverseComputedDeps = {};
                this._computeds = {};

                _.each(self.computeds, function (options, compName) {
                    self.addComputed(compName, options);
                });

                if (self.useDefineProperty) {
                    _.each(self.serialize(), function (value, key) {
                        Object.defineProperty(self, key, {
                            get: function () {
                                return this.prop(key);
                            },
                            set: function (val) {
                                this.prop(key, val);
                            }
                        });
                    });
                }

                self._changed = {};


                if (self.idAttribute != 'id' || !self.useDefineProperty) {
                    self.id = self.attributes[self.idAttribute];
                }

                self.cid = _.uniqueId('c');
                //заносим в глобальную коллекцию
                if (self.mapping && self.id) {
                    modelsMap[self.mapping] = modelsMap[self.mapping] || {};
                    modelsMap[self.mapping][self.id] = self;
                }
            },
            idAttribute: 'id',
            mapping: false,
            useDefineProperty: true,
            computeds: {},
            _computeds: {},
            defaults: {},
            serialize: function () {
                return _.extend({}, this.attributes, _.mapValues(this._computeds, function (comp, name) {
                    return comp.value;
                }));
            },
            toJSON: function () {
                return this.serialize();
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

                //if get
                if (arguments.length === 1 && typeof key === 'string') {

                    //if computed
                    if (comp = self._computeds[key]) {
                        return comp.value;
                    }
                    //if attribute
                    return self.attributes[key];
                }

                //if set
                var values = {}, changed = {};
                if (typeof key === 'string') {
                    values[key] = value;
                } else {
                    values = key;
                }

                _.each(values, function (val, key) {
                    changed[key] = self._changed[key] = val;

                    //if computed
                    if (comp = self._computeds[key]) {

                        comp.set(val);
                    } else {
                        self.attributes[key] = val;
                    }

                    if (self.reverseComputedDeps[key]) {
                        self.setComputeds(self.reverseComputedDeps[key]);
                    }
                    if (key === self.idAttribute && !(self.idAttribute == 'id' && self.useDefineProperty)) {
                        self.id = val;
                    }

                    self.fire('change:' + key, val);
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
                        data: me.serialize(),
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

    Model.filters = {};


    var filtersSplitter = /\s*\|\s*/,
        filtersSplitter2 = /(\w+)(\s*:\s*['"]([^'"]+)['"])?/;

    Model.hasFilters = function (string) {
        return string.indexOf('|') != -1;
    };

    Model.parseFilters = function (string) {
        var filters = string.split(filtersSplitter), value = filters.shift();
        return {
            value: value,
            filters: _.foldl(filters, function (result, string) {
                var matches = filtersSplitter2.exec(string);
                var options = matches[3];
                var filterName = matches[1];
                result[filterName] = options;
                return result;
            }, {})
        }
    };

    Model.Computed = Class.extend({

        constructor: function (options) {
            this.deps = options.deps || [];
            this.name = options.name;
            this.model = options.model;
            this.filters = options.filters || {};
            if (options.filtersString) {
                this.parseFilters(options.filtersString);
            }
            if (options.get) {
                this.getter = options.get;
            }
            if (options.set) {
                this.setter = options.set;
            }
            this.get();


            var rdps = this.model.reverseComputedDeps;
            _.each(this.deps, function (name) {
                if (!rdps[name]) {
                    rdps[name] = [];
                }
                rdps[name].push(options.name);
            });
        },
        value: undefined,
        deps: [],
        model: undefined,
        filters: {
            /*
             filt1: options,
             filt2: options
             */
        },
        getter: function (value) {
            return value;
        },
        setter: function (value, name) {
            this.prop(name, value);
        },
        parseFilters: function (string) {
            var f = Model.parseFilters(string);
            this.deps = [f.value];
            this.filters = f.filters;
        },
        get: function () {
            var self = this, vals = _.foldl(self.deps, function (array, name) {
                array.push(self.model.prop(name));
                return array;
            }, []);
            //var lastValue = self.value;

            var value = self.getter.apply(self.model, vals);


            self.value = _.foldl(this.filters, function (result, options, filterName) {
                return Model.filters[filterName].format(result, options);
            }, value);

            return self.value;
        },
        set: function (value) {
            this.setter.call(this.model, _.foldl(this.filters, function (result, options, filterName) {
                return Model.filters[filterName].unformat(result, options);
            }, value), this.name);
            this.get();
        }
    });

    window.Model = Model;
}(this));
