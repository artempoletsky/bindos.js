(function (window) {
    "use strict";
    /*globals _,$, Model*/
    var itself = function (self) {
            this.self = self;
        },
        Collection = Model.extend({

            constructor: function (models, attributes) {
                this.itself = new itself(this);
                this.models = [];
                this.length = 0;

                // хэш вида  id : глобальный индекс
                this._hashId = [];
                if (models) {
                    this.reset(models);
                }
                this.initialize(attributes);

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
                    this.fire('beforeReset', this.models);
                    this.models = [];
                    this.length = 0;
                    this._hashId = [];
                }
                if (!json) {
                    this.fire('reset');
                    return this;
                }

                var modelsArr = this.parse(json);
                this.add(modelsArr, 'end', !options.add);
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
                    hashIndex,
                    addedModels = [], _models;

                if (!(models instanceof Array)) {
                    models = [models];
                }

                if (typeof index !== 'number') {
                    index = this.length;
                } else if (index === 0) {
                    _models = models.reverse();
                }

                function addHashIndex(model, index) {
                    if (index === 0 && me.length) {
                        // берем наименьший порядковый индекс из первого элемента хэша
                        hashIndex = me._hashId[0].index - 1;
                        // добавляем элемент в начало хэша
                        me._hashId.unshift({
                            id: model.id,
                            index: hashIndex
                        });
                    }
                    else {
                        var length = me._hashId.length;
                        // проверка для пустого хэша
                        if (length === 0) {
                            hashIndex = 1;
                        }
                        else {
                            // берем порядковый индекс из последнего элемента в хэше
                            hashIndex = me._hashId[length - 1].index + 1;
                        }
                        // добавляем элемент в конец хэша
                        me._hashId.push({
                            id: model.id,
                            index: hashIndex
                        });
                    }
                }

                _.each(models, function (model, ind) {
                    if (!(model instanceof Model)) {
                        model = Model.createOrUpdate(me.model, model);
                    }
                    addedModels.push(model);

                    if (_models) {
                        addHashIndex(_models[ind], 0);
                    } else {
                        addHashIndex(model, (index + ind));
                    }

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
                var found;
                this.each(function (model, index) {
                    if (model.id == id) {
                        found = this.cutAt(index);
                        return false;
                    }
                });
                return found;
            },
            cutByCid: function (cid) {
                var found;
                var self = this;
                this.each(function (model, index) {
                    if (model.cid == cid) {
                        found = self.cutAt(index);
                        return false;
                    }
                })
                return found;
            },
            shift: function () {
                return this.cutAt(0);
            },
            pop: function () {
                return this.cutAt();
            },
            cutAt: function (index) {
                index !== undefined || (index = this.models.length - 1);
                var model = this.models.splice(index, 1)[0];
                // удаление элемента из хеша
                this._hashId.splice(index, 1);
                this.length = this.models.length;
                var cutted = {};
                cutted[index] = model;
                this.fire('cut', cutted);
                return model;
            },
            at: function (index) {
                return this.models[index];
            },
            /**
             * DEPRECATED since 26.01.2013
             */
            get: function () {
                return this.getByID.apply(this, arguments);
            },
            getByID: function (id) {
                var found;
                this.each(function (model) {
                    if (model.id == id) {
                        found = model;
                        return false;
                    }
                })
                return found;
            },
            getByCid: function (cid) {
                var found;
                this.each(function (model) {
                    if (model.cid == cid) {
                        found = model;
                        return false;
                    }
                })
                return found;
            },
            /**
             * Возвращение порядкового индекса модели
             * во всей коллекции
             * @param model
             * @return {Number}
             */
            getIndex: function (model) {
                var i = this.indexOf(model);
                return this._hashId[i].index;
            }
        });

    // Underscore methods that we want to implement on the Collection.
    var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
        'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
        'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortByDesc', 'sortedIndex',
        'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
        'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];

    // An internal function to generate lookup iterators.
    var lookupIterator = function (value) {
        return _.isFunction(value) ? value : function (obj) {
            return obj[value];
        };
    };

    // Sort the object's values by a criterion produced by an iterator.
    _.sortByDesc = function (obj, value, context) {
        var iterator = lookupIterator(value);
        return _.pluck(_.map(obj,function (value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iterator.call(context, value, index, list)
            };
        }).sort(function (left, right) {
                var a = left.criteria;
                var b = right.criteria;
                if (a !== b) {
                    if (a > b || a === void 0) return -1;
                    if (a < b || b === void 0) return 1;
                }
                return left.index < right.index ? -1 : 1;
            }), 'value');
    };

    // Mix in each Underscore method as a proxy to `Collection#models`.
    _.each(methods, function (method) {
        Collection.prototype[method] = function () {
            return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
        };
    });

    var filterMethods = ['filter', 'reject'];
    var sortMethods = ['sortBy', 'sortByDesc', 'shuffle'];

    _.each(filterMethods, function (method) {
        itself.prototype[method] = function () {
            var antonym = method == 'filter' ? 'reject' : 'filter';
            var self = this.self;
            var args = _.toArray(arguments);
            var newModels = _[method].apply(_, [self.models].concat(args));
            var rejectedModels = _[antonym].apply(_, [self.models].concat(args));
            var indexes = {};
            _.each(rejectedModels, function (model) {
                indexes[self.indexOf(model)] = model;
            });
            self.models = newModels;
            self.length = newModels.length;
            //console.log(indexes);
            self.fire('cut', indexes);
            return self;
        };
    });

    _.each(sortMethods, function (method) {
        itself.prototype[method] = function () {
            var self = this.self;
            var newModels = _[method].apply(_, [self.models].concat(_.toArray(arguments)));
            var indexes = {};
            _.each(newModels, function (model, index) {
                indexes[self.indexOf(model)] = index;
            });
            self.models = newModels;
            self.length = newModels.length;
            //console.log(indexes);
            self.fire('sort', indexes);
            return self;
        };
    });

    window.Collection = Collection;
}(this));