(function () {
    "use strict";
    /*globals ViewModel, Observable, Computed, _, $*/

    var createRow = function ($children, oModel, context, addArgs, ctx) {


        var model, newContext = {}, prop;

        addArgs.$parent = context;
        if (_.isFunction(oModel)) {
            addArgs.$self = oModel;
            oModel = oModel.obj;
        } else {
            addArgs.$self = Computed({
                initial: oModel.value,
                $el: $children
            });
        }

        addArgs.$self._oModel = oModel;
        var refresh = false;

        oModel.callAndSubscribe(function (value) {
            addArgs.$self(value);
            if (model) {
                //перестает слушать старую модель
                model.off(0, 0, ctx);
            }

            if (value) {
                _.extend(newContext, value.attributes);

                //слушает новую
                value.on('change', function (changed) {
                    _.extend(newContext, changed);
                    if (!refresh) {
                        refresh = true;
                        $children.refreshBinds();
                    }
                    refresh = false;
                }, ctx);


            } else {
                for (prop in newContext) {
                    delete newContext[prop];
                }
            }

            if (!refresh) {
                refresh = true;
                $children.refreshBinds();
            }
            refresh = false;

            model = value;

        });


        //парсит внутренний html как темплейт
        $children.each(function () {
            ViewModel.findBinds(this, newContext, addArgs);
        });

        $children.data('nkModel', addArgs);

        return addArgs;
    };


    ViewModel.binds.withModel = function ($el, value, context, addArgs) {
        addArgs = addArgs || {};


        createRow($el.children(), this.findObservable(value, context, addArgs, $el), context, addArgs, {});
        //останавливает внешний парсер
        return false;
    };


    var bufferViews = {};


    var getCompiledRow = function (templateName, model, index) {
        if (!bufferViews[templateName]) {
            return false;
        }

        if (!bufferViews[templateName].length) {
            return false;
        }


        var $row = bufferViews[templateName].pop();

        var addArgs = $row.data('nkModel');

        //console.log($row);

        addArgs.$index = index;
        addArgs.$self._oModel.set(model);

        return $row;
    };

    setInterval(function () {

        _.each(bufferViews, function (arr, key) {
            _.each(arr, function ($view) {
                $view.clearBinds();
                $view.data('nkModel', '');
            });
            bufferViews[key] = [];
        });

    }, 5 * 60 * 1000);


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
            elName = elem.tagName.toLowerCase(),
            compiledTemplateName;


        values = value.split(/\s*,\s*/);
        collectionName = values[0];
        templateName = values[1];


        rawTemplate = templateName ? '' : $el.html();


        compiledTemplateName = templateName ? templateName : _.uniqueId('nkEachModelTemplate');

        bufferViews[compiledTemplateName]=[];


        //когда меняется целая коллекция
        this.findCallAndSubscribe(collectionName, context, addArgs, function (collection) {


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
                var $tmplEl = $(rawTemplate);
                return function (model, $index, $parent) {

                    var $children = getCompiledRow(compiledTemplateName, model, $index);


                    if (!$children) {
                        $children = $tmplEl.clone();
                        createRow($children, Computed({
                            initial: model,
                            $el: $children
                        }).obj, collection, {
                            $index: $index
                        }, ctx);
                    }

                    tempChildrenLen = $children.length;
                    return $children;
                };
            };


            //template принимает модель и возвращает ее текстовое html представление
            template = templateName ? ViewModel.tmpl.get(templateName, templateConstructor) : templateConstructor(rawTemplate);


            //склеивает все представления всех моделей в коллекции
            onReset = function () {

                var html = $(document.createElement(elName)),
                    i = 0;
                //$el.children().clearBinds();
                $el.empty();


                collection.each(function (model) {
                    html.append(template(model, i++, collection));
                });

                $el.append(html.children());
            };
            onReset();


            collection.on('add', function (newModels, index, lastIndex) {
                var i = 0,
                    html = '';
                var _index = lastIndex || index;


                //console.log(newModels);

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

            //collection.on('reset', onReset, ctx);
            collection.on('cut', function (rejectedModels) {

                var index, model, $slice, $cutEl;

                var $children = $el.children();
                for (index in rejectedModels) {
                    model = rejectedModels[index];
                    model.off(0, 0, ctx);

                    $slice = $children.slice(index, index + tempChildrenLen);

                    bufferViews[compiledTemplateName].push($slice);

                    $slice.detach();


                }

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
        }, $el);

        return false;
    };

}());