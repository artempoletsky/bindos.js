(function () {
    "use strict";
    /*globals ViewModel, Observable, Computed, _, $*/

    ViewModel.binds.withModel = function ($el, name, viewModel) {


        var model;


        this.applyFilters(name, viewModel, function (newModel) {
            if (model) {
                model.fire('replace', newModel);
            }
            model = newModel;
        });

        return model;
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


    ViewModel.binds.eachModel = function ($el, value, model) {
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

        bufferViews[compiledTemplateName] = [];


        this.applyFilters(value, model, function(collection){
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
                        $children.each(function(){
                            ViewModel.findBinds(this, model);
                        });
                    }

                    tempChildrenLen = $children.length;
                    return $children;
                };
            };



            //template принимает модель и возвращает ее DOM html представление
            template = templateName ? ViewModel.tmpl.get(templateName, templateConstructor) : templateConstructor(rawTemplate);


            var html = $(document.createElement(elName)),
                i = 0;
            //$el.children().clearBinds();
            $el.empty();


            collection.each(function (model) {
                html.append(template(model, i++, collection));
            });

            $el.append(html.children());



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
                    index *= 1;
                    model = rejectedModels[index];
                    model.off(0, 0, ctx);

                    $slice = $children.slice(index, index + tempChildrenLen);

                    bufferViews[compiledTemplateName].push($slice);

                    $slice.detach();


                }

            }, ctx);
            collection.on('sort', function (indexes) {
                var $tempDiv = $(document.createElement(elName)),
                    $children = $el.children();

                _.each(indexes, function (newIndex, oldIndex) {
                    $tempDiv.append($children.slice(newIndex, newIndex + tempChildrenLen));
                });
                $el.append($tempDiv.children());
            }, ctx);


        }, function(oldCollection){
            oldCollection.off(0, 0, ctx);

            oldCollection.each(function (model) {
                model.off(0, 0, ctx);
            });
        });


        return false;
    };

}());