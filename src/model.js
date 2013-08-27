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
			save: function (data) {

                var me = this,
                    errors = this.validate(data),
                    url;

                if (errors) {
                    this.trigger('invalid', this, errors);
                    return;
                }


                if ( _.isFunction(this.url)) {
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
                    this.sync('update', url, {
                        data: me._changed,
                        success: function (data) {
                            me.update(data);
                        }
                    });
                } else {
                    this.sync('create', url, {
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
