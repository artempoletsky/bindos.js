(function () {
    "use strict";
    /*globals _, $, BaseObservable, ViewModel*/
    var modelToObservables = function (attrs) {

        var observables = {};
        _.each(attrs, function (val, prop) {
            observables[prop] = BaseObservable({
                initial: val
            });
        });

        return observables;
    };


    ViewModel.binds.eachModel = function (elem, value, context, addArgs) {

        var options,
            collection,
            templateName,
            listenModels,
            innerBinds,
            values,
            collectionObs,
            $el = $(elem),
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
            collection = values[0];
            templateName = values[1];
            listenModels = false;
            innerBinds = false;
        }
        else {
            collection = options.collection;
            templateName = options.template;
            listenModels = options.listenModels;
            innerBinds = options.innerBinds;
        }

        collectionObs = this.findObservable(context, collection, addArgs);


        rawTemplate = templateName ? '' : $el.html();

        //console.log(rawTemplate);
        //когда меняется целая коллекция
        collectionObs.callAndSubscribe(function (collection) {

            if (oldCollection) {
                oldCollection.off(0, 0, ctx);
                if (listenModels) {
                    oldCollection.each(function (model) {
                        model.off(0, 0, ctx);
                    });
                }
            }

            oldCollection = collection;
            $el.empty();
            var observers = [],
                tempChildrenLen,
                templateConstructor,
                template,
                listenModel,
                createRow,
                onReset;
            if (!collection) {
                return;
            }


            tempChildrenLen = 1;
            createRow = function (rawTemplate, newModel, $index, $parent) {
                var observer,
                    oldAsync = ViewModel.compAsync,
                    tempDiv = document.createElement(elName),
                    modelObservable = BaseObservable({
                        initial: newModel
                    }),
                    context = modelToObservables(newModel.toJSON()),
                    addArgs = {
                        $self: modelObservable,
                        $index: BaseObservable({
                            initial: $index
                        }),
                        $parent: BaseObservable({
                            initial: $parent
                        })
                    };
                tempDiv.innerHTML = rawTemplate;

                ViewModel.compAsync = false;
                ViewModel.findBinds(tempDiv, context, addArgs);
                ViewModel.compAsync = oldAsync;
                observer = {
                    addArgs: addArgs,
                    context: context,
                    div: tempDiv
                };
                return observer;

            };
            templateConstructor = function (rawTemplate) {
                var observer = createRow(rawTemplate, new collection.model());


                tempChildrenLen = $(observer.div).children().length;

                return function (model, $index, $parent) {
                    if (innerBinds) {
                        observer = createRow(rawTemplate, model, $index, $parent);
                        observers.splice($index, 0, observer);
                        return $(observer.div).children();
                    }
                    var args = observer.addArgs;

                    args.$index($index);
                    args.$parent($parent);
                    args.$self(model);
                    _.each(observer.context, function (obs, key) {
                        obs(model.prop(key));
                    });
                    return observer.div.innerHTML;
                };
            };

            //template принимает модель и возвращает ее текстовое html представление
            template = templateName ? ViewModel.tmpl.get(templateName, templateConstructor) : templateConstructor(rawTemplate);

            listenModel = function (model) {
                //console.log('listen '+model.prop('name'));

                model.on('change', function (changed) {
                    var index = collection.indexOf(model),
                        observer,
                        $children;
                    if (innerBinds) {
                        observer = observers[index].context;
                        _.each(changed, function (val, prop) {
                            observer[prop](val);
                        });
                    }
                    else {
                        $children = $el.children();
                        $children.slice(index, index + tempChildrenLen).empty().remove();
                        $children.eq((index - 1) * tempChildrenLen).after(template(model, index, collection));
                    }

                }, ctx);
            };
            //склеивает все представления всех моделей в коллекции
            onReset = function () {
                var i = 0,
                    html = '';
                $el.empty();
                observers = [];
                if (innerBinds) {
                    collection.each(function (model) {
                        $el.append(template(model, i++, collection));
                        listenModel(model);
                    });
                }
                else {
                    collection.each(function (model) {
                        html += template(model, i++, collection);
                        if (listenModels) {
                            listenModel(model);
                        }
                    });

                    $el.html(html);
                }

            };
            onReset();

			collection.on('add', function (newModels, index) {
				var i = 0,
					html = '';
				if (innerBinds) {
					html = $(document.createElement(elName));
					_.each(newModels, function (model) {
						html.append(template(model, index + i++, collection));
						listenModel(model);
					});
					html = html.children();
				}
				else {
					//склеивает все новые представления всех новых моделей в коллекции
					_.each(newModels, function (model) {
						html += template(model, index + i++, collection);
						if (listenModels) {
							listenModel(model);
						}
					});
				}


				if (index === 0) {
					$el.prepend(html);
				} else if (tempChildrenLen && $el.children().eq(index * tempChildrenLen).length) {
					$el.children().eq(index * tempChildrenLen).after(html);
				} else {
					$el.append(html);
				}
			}, ctx);
            if (listenModels) {
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
                    if (listenModels) {
                        model.off(0, 0, ctx);
                    }

                    if (innerBinds) {
                        observers.splice(index, 1);
                    }

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


