(function () {
    "use strict";
    let ViewModel = bindos.ViewModel;

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
        return false;
        if (!bufferViews[templateName]) {
            return false;
        }

        if (!bufferViews[templateName].length) {
            return false;
        }


        var $row = bufferViews[templateName].pop();



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


    ViewModel.binds.each = function (elem, value, model) {
        var
            values,
            collectionName,
            templateName,
            //заглушка чтобы быстро делать off
            ctx = {},
            oldCollection,
            rawTemplate,
            elName = elem.tagName.toLowerCase(),
            compiledTemplateName;


        values = value.split(/\s*,\s*/);
        collectionName = values[0];
        templateName = values[1];


        rawTemplate = templateName ? '' : elem.innerHTML;


        compiledTemplateName = templateName ? templateName : $.uniqueId('nkEachModelTemplate');

        if (!collectionName) {
            collectionName = 'collection';
        }
        bufferViews[compiledTemplateName] = [];


        this.applyFilters(collectionName, model, function (collection) {
            elem.empty();
            var tempChildrenLen,
                templateConstructor,
                template,
                onReset;

            if (!collection) {
                return;
            }



            tempChildrenLen = 1;


            templateConstructor = function (rawTemplate) {
                var tmplEl = $.parse(rawTemplate)

                if (!tmplEl.length) {
                    tmplEl = [tmplEl];
                }

                return function (model, $index, $parent) {

                    var $children = getCompiledRow(compiledTemplateName, model, $index);
                    let clone = [];
                    if (!$children) {
                        for (let el of tmplEl) {
                            el = el.cloneNode(true);
                            ViewModel.findBinds(el, model);
                            clone.push(el);
                        }
                    }

                    tempChildrenLen = clone.length;
                    return clone;
                };
            };



            //template принимает модель и возвращает ее DOM html представление
            template = templateName ? ViewModel.tmpl.get(templateName, templateConstructor) : templateConstructor(rawTemplate);


            var i = 0;

            elem.empty();

            let frag = document.createDocumentFragment();

            function appendChildren(container, children) {
                for (let ch of children) {
                    container.appendChild(ch);
                }
            }

            collection.each((model) => {
                appendChildren(frag, template(model, i++, collection));
            });

            elem.appendChild(frag);



            collection.on('add', function (newModels, index, lastIndex) {
                var i = 0,
                    html = '';
                var _index = lastIndex || index;


                //console.log(newModels);
                let frag = document.createDocumentFragment();

                for (let model of newModels) {
                    appendChildren(frag, template(model, _index + i++, collection));
                }

                if (index === 0) {
                    if (!elem.firstChild) {
                        elem.appendChild(frag);
                    } else {
                        elem.insertBefore(elem.firstChild, frag);
                    }

                } else if (!index || index === collection.length - newModels.length) {
                    elem.appendChild(frag);
                } else {
                    elem.insertBefore(elem.children[index * tempChildrenLen], frag);
                }

            }, ctx);

            //collection.on('reset', onReset, ctx);
            collection.on('cut', function (rejectedModels) {

                var index, model, slice;

                var children = Array.from(elem.children);
                for (index in rejectedModels) {
                    index *= 1;
                    model = rejectedModels[index];
                    model.off(0, 0, ctx);

                    slice = children.slice(index, index + tempChildrenLen);

                    bufferViews[compiledTemplateName].push(slice);
                    for (let el of slice) {
                        elem.removeChild(el);
                    }
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


        }, function (oldCollection) {
            oldCollection.off(0, 0, ctx);

            oldCollection.each(function (model) {
                model.off(0, 0, ctx);
            });
        });


        return false;
    };

}());
