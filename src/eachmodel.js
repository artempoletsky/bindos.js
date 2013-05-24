(function () {
    "use strict";
    /*globals ViewModel, BaseObservable, _, $*/

    var createRow = function ($children, oModel, context, addArgs, ctx) {
            if (!oModel()) {
                throw new Error("Model for withModel must not be empty");
            }

            var oldCompAsync, model, newContext = {};

            _.each(oModel().toJSON(), function (value, key) {
                newContext[key] = BaseObservable({
                    initial: value
                });
            });

            _.extend(addArgs, {
                $self: oModel,
                $parent: BaseObservable({
                    initial: context
                })
            });

            oModel.callAndSubscribe(function (value) {
                if (model) {
                    //перестает слушать старую модель
                    model.off(0, 0, ctx);
                }

                if (value) {

                    //слушает новую
                    value.on('change', function (changed) {
                        _.each(changed, function (val, key) {
                            if (newContext[key]) {
                                newContext[key](val);
                            }
                        });
                    }, ctx);

                    //обновляет все obserbavles при смене модели
                    _.each(newContext, function (obs, key) {
                        newContext[key](value.attributes[key]);
                    });
                } else {
                    //обнуляет все observables
                    _.each(newContext, function (obs) {
                        obs('');
                    });
                }
                model = value;

            });

            oldCompAsync = ViewModel.compAsync;
            ViewModel.compAsync = false;
            //парсит внутренний html как темплейт
            $children.each(function () {
                ViewModel.findBinds(this, newContext, addArgs);
            });
            ViewModel.compAsync = oldCompAsync;
            return addArgs;
        },
        cloneRow = function (ctx, rawTemplate, elName, model, collection, index) {
            var args, $children, tempDiv = document.createElement(elName);
            tempDiv.innerHTML = rawTemplate;
            $children = $(tempDiv).children();

            args = createRow($children, BaseObservable({
                initial: model
            }), collection, {
                $index: BaseObservable({
                    initial: index
                })
            }, ctx);

            return {
                $children: $children,
                tempDiv: tempDiv,
                args: args
            };
        },
        listenModel = function ($el, tempChildrenLen, template, collection, ctx, model) {
            model.on('change', function () {
                var index = collection.indexOf(model),
                    $children = $el.children();

                $children.slice(index, index + tempChildrenLen).empty().remove();
                $children.eq((index - 1) * tempChildrenLen).after(template(model, index, collection));
            }, ctx);
        };

    ViewModel.binds.withModel = function ($el, value, context, addArgs) {
        addArgs = addArgs || {};
        //$children, oModel, context, addArgs, ctx
        createRow($el.children(), this.findObservable(context, value, addArgs), context, addArgs, {});
        //останавливает внешний парсер
        return false;
    };

    ViewModel.binds.eachModel = function ($el, value, context, addArgs) {
        var options,
            values,
            elem= $el[0],
        //заглушка чтобы быстро делать off
            ctx = {},
            oldCollection,
            rawTemplate,
            elName = elem.tagName.toLowerCase();
        try {
            options = this.parseOptionsObject(value);
        } catch (exception) {

        }
        //если в value не объект, а массив значений
        if (!options) {
            values = value.split(/\s*,\s*/);
            options = {};
            options.collection = values[0];
            options.templateName = values[1];
        }

        rawTemplate = options.templateName ? '' : $el.html();

        //когда меняется целая коллекция
        this.findObservable(context, options.collection, addArgs).callAndSubscribe(function (collection) {

            if (oldCollection) {
                oldCollection.off(0, 0, ctx);
                if (options.listenModels) {
                    oldCollection.each(function (model) {
                        model.off(0, 0, ctx);
                    });
                }
            }

            oldCollection = collection;
            $el.empty();
            var tempChildrenLen,
                templateConstructor,
                template,
                onReset;

            if (!collection) {
                return;
            }

            tempChildrenLen = 1;

            if (options.innerBinds) {
                templateConstructor = function (rawTemplate) {
                    return function (model, $index, $parent) {
                        var $children = cloneRow(ctx, rawTemplate, elName, model, $parent, $index).$children;
                        tempChildrenLen = $children.length;
                        return $children;
                    };
                };
            }
            else {
                templateConstructor = function (rawTemplate) {
                    var obj = cloneRow(ctx, rawTemplate, elName, new collection.model(), collection, undefined),
                        tempDiv = obj.tempDiv,
                        args = obj.args;
                    tempChildrenLen = obj.$children.length;

                    return function (model, $index, $parent) {
                        args.$self(model);
                        args.$index($index);
                        args.$parent($parent);
                        return tempDiv.innerHTML;
                    };
                };
            }

            //template принимает модель и возвращает ее текстовое html представление
            template = options.templateName ? ViewModel.tmpl.get(options.templateName, templateConstructor) : templateConstructor(rawTemplate);


            //склеивает все представления всех моделей в коллекции
            onReset = function () {
				var i = collection.getIndex(collection.at(0))-1,
					html = '';
				$el.empty();

				if(i < 0) i = 0;

                if (options.innerBinds) {
                    collection.each(function (model) {
                        $el.append(template(model, i++, collection));
                    });
                }
                else {
                    collection.each(function (model) {
                        html += template(model, i++, collection);
                        if (options.listenModels) {
                            listenModel($el, tempChildrenLen, template, collection, ctx, model);
                        }
                    });
                    $el.html(html);
                }

            };
            onReset();

            collection.on('add', function (newModels, index, lastIndex) {
                var i = 0,
                    html = '';
                var _index = lastIndex || index;
                if (options.innerBinds) {
                    html = $(document.createElement(elName));
                    _.each(newModels, function (model) {
                        html.append(template(model, _index + i++, collection));
                    });
                    html = html.children();
                } else {
                    //склеивает все новые представления всех новых моделей в коллекции
                    _.each(newModels, function (model) {
                        html += template(model, _index + i++, collection);
                        if (options.listenModels) {
                            listenModel($el, tempChildrenLen, template, collection, ctx, model);
                        }
                    });
                }
                if (index === 0) {
                    $el.prepend(html);
                } else if (!index || index === collection.length - newModels.length) {
                    $el.append(html);
                } else {
                    $el.children().eq(index * tempChildrenLen).before(html);
                }
            }, ctx);
            if (options.listenModels) {
                collection.on('beforeReset', function (models) {
                    _.each(models, function (model) {
                        model.off(0, 0, ctx);
                    });
                }, ctx);
            }
            collection.on('reset', onReset, ctx);
            collection.on('cut', function (rejectedModels) {

                var $children = $el.children();

                _.each(rejectedModels, function (model, index) {
                    index *= 1;
                    model.off(0, 0, ctx);
                    $children.slice(index, index + tempChildrenLen).empty().remove();
                });
            }, ctx);
            collection.on('sort', function (indexes) {
                var $tempDiv = $(document.createElement('div')),
                    $children = $el.children();

                _.each(indexes, function (newIndex, oldIndex) {
                    oldIndex *= 1;
                    $tempDiv.append($children.slice(oldIndex, oldIndex + tempChildrenLen));
                });
                $el.append($tempDiv.children());
            }, ctx);
        });

        return false;
    };
    //deprecated since 07.03.13
    ViewModel.binds.eachModelLight = ViewModel.binds.eachModel;
}());


