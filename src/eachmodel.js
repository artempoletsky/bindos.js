(function () {
    "use strict";
    /*globals ViewModel, Observable, Computed, _, $*/

    var createRow = function ($children, oModel, context, addArgs, ctx) {


            var model, newContext = {}, prop;


            _.extend(addArgs, {
                $parent: context
            });


            oModel.callAndSubscribe(function (value) {
                addArgs.$self = value;
                if (model) {
                    //перестает слушать старую модель
                    model.off(0, 0, ctx);
                }

                if (value) {
                    _.extend(newContext, value.attributes);
                    //слушает новую
                    value.on('change', function (changed) {
                        _.extend(newContext, changed);
                        $children.refreshBinds();
                    }, ctx);


                } else {
                    for (prop in newContext) {
                        delete newContext[prop];
                    }
                }
                $children.refreshBinds();
                model = value;

            });

            //парсит внутренний html как темплейт
            $children.each(function () {
                ViewModel.findBinds(this, newContext, addArgs);
            });


            //$children.refreshBinds();


            return addArgs;
        },
        cloneRow = function (ctx, rawTemplate, elName, model, collection, index) {
            var args, $children, tempDiv = document.createElement(elName);
            try {
                tempDiv.innerHTML = rawTemplate;
            } catch (e) {
                console.log(e);
            }

            $children = $(tempDiv).children();

            args = createRow($children, Observable(model).obj, collection, {
                $index: index
            }, ctx);

            return {
                $children: $children,
                tempDiv: tempDiv,
                args: args
            };
        };

    ViewModel.binds.withModel = function ($el, value, context, addArgs) {
        addArgs = addArgs || {};
        //$children, oModel, context, addArgs, ctx
        createRow($el.children(), this.findObservable(value, context, addArgs, $el), context, addArgs, {});
        //останавливает внешний парсер
        return false;
    };

    ViewModel.binds.eachModel = function ($el, value, context, addArgs) {
        var
            values,
            collectionName,
            templateName,
            elem = $el[0],
        //заглушка чтобы быстро делать off
            ctx = {},
            oldCollection,
            rawTemplate,
            elName = elem.tagName.toLowerCase();


        values = value.split(/\s*,\s*/);
        collectionName = values[0];
        templateName = values[1];


        rawTemplate = templateName ? '' : $el.html();

        //когда меняется целая коллекция
        this.findObservable(collectionName, context, addArgs, $el).callAndSubscribe(function (collection) {

            if (oldCollection) {
                oldCollection.off(0, 0, ctx);

                oldCollection.each(function (model) {
                    model.off(0, 0, ctx);
                });

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


            templateConstructor = function (rawTemplate) {
                return function (model, $index, $parent) {
                    var $children = cloneRow(ctx, rawTemplate, elName, model, $parent, $index).$children;
                    tempChildrenLen = $children.length;
                    return $children;
                };
            };


            //template принимает модель и возвращает ее текстовое html представление
            template = templateName ? ViewModel.tmpl.get(templateName, templateConstructor) : templateConstructor(rawTemplate);


            //склеивает все представления всех моделей в коллекции
            onReset = function () {
                var i = collection.getIndex(collection.at(0)) - 1,
                    html = '';
                $el.children().clearBinds();
                $el.empty();

                if (i < 0) {
                    i = 0;
                }

                collection.each(function (model) {
                    $el.append(template(model, i++, collection));
                });
            };
            onReset();

            collection.on('add', function (newModels, index, lastIndex) {
                var i = 0,
                    html = '';
                var _index = lastIndex || index;


                html = $(document.createElement(elName));
                _.each(newModels, function (model) {
                    html.append(template(model, _index + i++, collection));
                });
                html = html.children();

                if (index === 0) {
                    $el.prepend(html);
                } else if (!index || index === collection.length - newModels.length) {
                    $el.append(html);
                } else {
                    $el.children().eq(index * tempChildrenLen).before(html);
                }
            }, ctx);


            collection.on('beforeReset', function (models) {
                _.each(models, function (model) {
                    model.off(0, 0, ctx);
                });
            }, ctx);

            collection.on('reset', onReset, ctx);
            collection.on('cut', function (rejectedModels) {

                var $children = $el.children();

                _.each(rejectedModels, function (model, index) {
                    index *= 1;
                    model.off(0, 0, ctx);
                    $children.slice(index, index + tempChildrenLen).clearBinds().empty().remove();
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

}());


