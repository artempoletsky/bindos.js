(function (window) {
    "use strict";


    let modelsMap = {},

        Model = window.Events.extend({

            setComputeds(names) {
                let self = this;
                names.forEach((name) => self.fire('change:' + name, self._computeds[name].get()));
            },

            addComputed(name, options) {
                options.name = name;
                options.model = this;
                this._computeds[name] = new Model.Computed(options);
            },

            removeComputed(name) {
                var self = this;
                delete self._computeds[name];
                for (let key in self.reverseComputedDeps) {
                    let deps = self.reverseComputedDeps[key];
                    self.reverseComputedDeps[key] = deps.filter((n) => n != name);
                }
            },

            useDefineProperty: true,
            mapping: false,
            computeds: {},
            defaults: {},
            idAttribute: 'id',
            constructor(data = {}) {

                var self = this;


                this.reverseComputedDeps = {};

                this._computeds = {};

                self.attributes = $.extend({}, self.defaults, self.parse(data));


                for (let compName in self.computeds) {
                    self.addComputed(compName, self.computeds[compName]);
                }

                if (self.useDefineProperty) {
                    let serialized = self.serialize();
                    for (let key in serialized) {
                        Object.defineProperty(self, key, {
                            get: function () {
                                return this.prop(key);
                            },
                            set: function (val) {
                                this.prop(key, val);
                            }
                        });
                    }
                }

                self._changed = {};


                if (self.idAttribute != 'id' || !self.useDefineProperty) {
                    self.id = self.attributes[self.idAttribute];
                }

                self.cid = $.uniqueId('c');
                //заносим в глобальную коллекцию
                if (self.mapping && self.id) {
                    modelsMap[self.mapping] = modelsMap[self.mapping] || {};
                    modelsMap[self.mapping][self.id] = self;
                }
            },

            serialize() {
                return $.extend({}, this.attributes, $.mapValues(this._computeds, function (comp) {
                    return comp.value;
                }));
            },


            toJSON() {
                return this.serialize();
            },


            parse(json) {
                return json;
            },


            update(json) {
                this.prop(this.parse(json));
                this._changed = {};
                return this;
            },


            prop(key, value) {
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

                for (let key in values) {
                    let val = values[key];
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
                }

                this.fire('change', changed);
                return this;
            },


            validate() {
                return false;
            },


            fetch(options) {
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

                Model.sync('get', this.url(), $.extend({}, options, opt));
                return this;
            },


            save(data) {

                var me = this,
                    errors = this.validate(data),
                    url;

                if (errors) {
                    this.trigger('invalid', this, errors);
                    return;
                }


                if (typeof this.url == 'function') {
                    url = this.url();
                } else {
                    url = this.url;
                }

                if (data) {
                    this.prop(data);
                }
                if (this.id) {

                    if (Object.keys(me._changed).length === 0) {//нечего сохранять
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


            remove() {
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
            filters: filters.reduce(function (result, string) {
                var matches = filtersSplitter2.exec(string);
                var options = matches[3];
                var filterName = matches[1];
                result[filterName] = options;
                return result;
            }, {})
        }
    };

    class Computed {

        constructor(options) {
            this.deps = options.deps || [];
            this.name = options.name;
            this.model = options.model;
            this.filters = options.filters || {};
            this.value = undefined;
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

            this.deps.forEach(function (name) {
                if (!rdps[name]) {
                    rdps[name] = [];
                }
                rdps[name].push(options.name);
            });
        }


        getter(value) {
            return value;
        }

        setter(value, name) {
            this.prop(name, value);
        }

        parseFilters(string) {
            var f = Model.parseFilters(string);
            this.deps = [f.value];
            this.filters = f.filters;
        }

        get() {
            var self = this, vals = self.deps.reduce(function (array, name) {
                array.push(self.model.prop(name));
                return array;
            }, []);
            //var lastValue = self.value;

            var value = self.getter.apply(self.model, vals);
            let result = value;
            for (let filterName in this.filters) {
                let options = this.filters[key];
                result = Model.filters[filterName].format(result, options);
            }
            this.value = result;

            return self.value;
        }

        set(value) {
            let result = value;
            for (let filterName in this.filters) {
                let options = this.filters[filterName];
                result = Model.filters[filterName].unformat(result, options);
            }
            this.setter.call(this.model, result, this.name);
            this.get();
        }
    }

    Model.Computed = Computed;
    window.Model = Model;
}(this));
