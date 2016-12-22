(function (window) {
    "use strict";
    /*globals _,$, Model*/
    var itself = function (self) {
            this.self = self;
        },
        Collection = Model.extend({
            constructor: function (models, attributes) {
                this._super();

                this.itself = new itself(this);
                this.models = [];
                this.length = 0;

                if (models) {
                    this.reset(models);
                }

            },
            models: [],
            model: Model,
            url: function () {
                return this.baseURL + this.model.prototype.mapping + '/';
            },
            fetch: function (options) {
                options = options || {};
                var me = this,
                    opt = {
                        success: function (data) {
                            me.reset(data, options);
                            if (typeof options.success === 'function') {
                                options.success.apply(me, arguments);
                            }
                        },
                        error: function () {
                            if (typeof options.error === 'function') {
                                options.error.apply(me, arguments);
                            }
                        }
                    },
                    resOpt = _.extend({}, options, opt);
                Model.sync('GET', this.url(), resOpt);
            },
            reset: function (json, options) {
                options = options || {};
                if (!options.add) {
                    this.fire('cut', this.models);
                    this.models = [];
                    this.length = 0;
                }
                if (!json) {
                    this.fire('reset');
                    return this;
                }

                var modelsArr = this.parse(json);
                this.add(modelsArr, 'end');

                if (!options.add) {
                    this.fire('reset');
                }
                return this;
            },
            push: function (model) {
                return this.add(model);
            },
            unshift: function (model) {
                return this.add(model, 0);
            },
            add: function (models, index, silent) {

                var me = this,
                    addedModels = [];

                if (!(models instanceof Array)) {
                    models = [models];
                }

                if (typeof index !== 'number') {
                    index = this.length;
                }


                models.forEach(function (model, ind) {
                    if (!(model instanceof Model)) {
                        model = Model.createOrUpdate(me.model, model);
                    }
                    addedModels.push(model);


                    model.one('remove', function () {
                        me.cutByCid(this.cid);
                    });

                    me.models.splice(index + ind, 0, model);

                });

                this.length = this.models.length;
                if (!silent) {
                    this.fire('add', addedModels, index);
                }
                return this;
            },
            cut: function (id) {
                var found, me = this;
                this.each(function (model, index) {
                    if (model.id === id) {
                        found = me.cutAt(index);
                        return false;
                    }
                });
                return found;
            },
            cutByCid: function (cid) {
                var found,
                    self = this;
                this.each(function (model, index) {
                    if (model.cid === cid) {
                        found = self.cutAt(index);
                        return false;
                    }
                });
                return found;
            },
            shift: function () {
                return this.cutAt(0);
            },
            pop: function () {
                return this.cutAt();
            },
            cutAt: function (index) {
                if (index === undefined) {
                    index = this.models.length - 1;
                }

                var model = this.models.splice(index, 1)[0], cutted;


                this.length = this.models.length;
                cutted = {};
                cutted[index] = model;
                this.fire('cut', cutted);
                return model;
            },
            at: function (index) {
                return this.models[index];
            },
            getByID: function (id) {
                var found;
                this.each(function (model) {
                    if (model.id == id) {
                        found = model;
                        return false;
                    }
                });
                return found;
            },
            getByCid: function (cid) {
                var found;
                this.each(function (model) {
                    if (model.cid == cid) {
                        found = model;
                        return false;
                    }
                });
                return found;
            }
        }),
        whereMethods = ['detect', 'filter', 'select', 'reject', 'find', 'every', 'all', 'some', 'any', 'max', 'min', 'sortBy', 'sortByDesc', 'first', 'initial', 'rest', 'last', 'groupBy'],
        methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'foldl', 'foldr',
            'include', 'contains', 'invoke', 'sortedIndex',
            'toArray', 'size', 'without', 'indexOf',
            'shuffle', 'lastIndexOf', 'isEmpty'],
        filterMethods = ['filter', 'reject'],
        sortMethods = ['sortBy', 'sortByDesc', 'shuffle'],
        vanillaMethods = ['forEach'];

    vanillaMethods.forEach((method) => {
        Collection.prototype[method] = function (...args) {
            return this.models[method](...args);
        };
    });

    Collection.prototype.each = Collection.prototype.forEach;

    if (window._) {


        // Sort the object's values by a criterion produced by an iterator.
        _.mixin({
            sortByDesc: function (obj, value, context) {
                return this.sortBy(obj, value, context).reverse();
            }
        });


        var where = function (query) {
            return function (model) {
                var valid = true;
                _.forIn(query, function (value, key) {
                    if (value !== model.attributes[key]) {
                        valid = false;
                        return false;
                    }
                });
                return valid;
            };
        };

        var pluck = function (prop) {
            return function (model) {
                return model.attributes[prop];
            };
        };


        _.each(methods, function (method) {
            Collection.prototype[method] = function (fn, thisArg) {
                return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
            };
        });

        _.each(whereMethods, function (method) {
            Collection.prototype[method] = function (fn, thisArg) {
                if (typeof fn == 'function') {
                    return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
                }
                var query;
                if (typeof fn == 'string') {
                    if (arguments.length == 2) {
                        query = {};
                        query[fn] = thisArg;
                    } else {
                        return _[method](this.models, pluck(fn));
                    }
                }
                if (!query) {
                    query = fn;
                }
                return _[method](this.models, where(query));
            };
        });


        _.each(filterMethods, function (method) {
            itself.prototype[method] = function () {
                var antonym = method === 'filter' ? 'reject' : 'filter',
                    self = this.self,
                    args = _.toArray(arguments),
                    newModels = self[method].apply(self, arguments),
                    rejectedModels = self[antonym].apply(self, arguments),
                    indexes = {};
                _.each(rejectedModels, function (model) {
                    indexes[self.indexOf(model)] = model;
                });
                self.models = newModels;
                self.length = newModels.length;
                self.fire('cut', indexes);
                return self;
            };
        });

        _.each(sortMethods, function (method) {
            itself.prototype[method] = function () {
                var self = this.self,
                    newModels = self[method].apply(self, arguments),
                    indexes = {};
                _.each(newModels, function (model, index) {
                    indexes[index] = self.indexOf(model);
                });
                self.models = newModels;
                self.length = newModels.length;
                self.fire('sort', indexes);
                return self;
            };
        });
    }
    window.Collection = Collection;
}(this));