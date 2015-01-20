/*globals ViewModel, $, _, Computed, Observable, ObjectObservable*/
(function () {
    "use strict";


    var zeroEmpty = function (value) {
        return value || (value === 0 ? '0' : '');
    };

    ViewModel.replaceable = function (model, callbackNew, callbackOld) {
        var oldModel;
        var onReplace = function (newModel) {
            if (oldModel) {
                oldModel.off('replace', onReplace);
                callbackOld(oldModel);
            }

            callbackNew(newModel);

            newModel.on('replace', onReplace);
            oldModel = newModel
        }
        onReplace(model);
    }
    ViewModel.applyFilters = function (value, model, callbackNew, callbackOld) {
        var name;

        ViewModel.replaceable(model, function (newModel) {
            if (Model.hasFilters(value)) {
                name = _.uniqueId('vmDynamicComputed');
                newModel.addComputed(name, {
                    filtersString: value
                });
            } else {
                name = value;
            }

            newModel.on('change:' + name, callbackNew);
            callbackNew(newModel.prop(name));
        }, function (oldModel) {

            if (Model.hasFilters(value)) {
                oldModel.removeComputed(name);
            }

            oldModel.off('change:' + name, callbackNew);
            if(callbackOld){
                callbackOld(oldModel.prop(name));
            }
        });


        return name;
    }

    ViewModel.binds = {
        log: function ($el, value, model) {
            this.applyFilters(value, model, function (val) {
                console.log(model, '.', value, '=', val);
            });
        },
        src: function ($el, value, context, addArgs) {
            var elem = $el[0];
            this.findCallAndSubscribe(value, context, addArgs, function (val) {
                elem.src = val || '';
            }, $el);
        },
        html: function ($el, value, model) {
            this.applyFilters(value, model, function (val) {
                $el.html(zeroEmpty(val));
            });
        },
        text: function ($el, value, model) {
            this.applyFilters(value, model, function (val) {
                $el.text(zeroEmpty(val));
            });
        },
        value: function ($el, value, model) {
            var name = this.applyFilters(value, model, function (val) {
                $el.val(zeroEmpty(val));
            });

            $el.on('change keyup keydown', function () {
                var val = $el.val();
                //if ($el.get() !== val) {
                model.prop(name, val);
                //}
            });
        },
        attr: function ($el, value, context) {
            var elem = $el[0];
            _.each(this.parseOptionsObject(value), function (condition, attrName) {
                ViewModel.applyFilters(condition, context, function (val) {
                    if (val !== false && val !== undefined && val !== null) {
                        elem.setAttribute(attrName, val);
                    } else {
                        elem.removeAttribute(attrName);
                    }
                });
            });
        },
        style: function ($el, value, context) {
            _.each(this.parseOptionsObject(value), function (condition, style) {
                ViewModel.applyFilters(condition, context, function (val) {
                    $el.css(style, val);
                });
            });
        },
        css: function ($el, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function (condition, className) {
                ViewModel.applyFilters(condition, context, function (val) {
                    if (val) {
                        $el.addClass(className);
                    }
                    else {
                        $el.removeClass(className);
                    }
                });
            });
        },
        display: function ($el, value, context) {
            ViewModel.applyFilters(value, context, function (val) {
                if (val) {
                    $el.show();
                }
                else {
                    $el.hide();
                }
            });
        },
        click: function ($el, value, context, addArgs) {
            var fn = this.evil(value, context, addArgs, $el)();
            $el.click(function () {
                fn.apply(context, arguments);
            });
        },
        className: function ($el, value, context) {
            var oldClassName;

            ViewModel.applyFilters(value, context, function (className) {
                if (oldClassName) {
                    $el.removeClass(oldClassName);
                }
                if (className) {
                    $el.addClass(className);
                }
                oldClassName = className;
            });
        },
        events: function ($el, value, context, addArgs) {
            var self = this;
            _.each(this.parseOptionsObject(value), function (expr, eventName) {
                var callback = self.evil(expr, context, addArgs)();
                $el.bind(eventName, function (e) {
                    callback.call(context, e);
                });
            });
        },
        view: function ($el, value, context, addArgs) {
            var options, ViewModelClass, args, vm, values;
            try {
                options = this.parseOptionsObject(value);
            } catch (error) {
                values = value.split(/\s*,\s*/);
                options = {
                    'class': values[0],
                    'name': values[1]
                };
            }

            if (options['class']) {
                ViewModelClass = this.evil(options['class'], context, addArgs)();
            } else {
                ViewModelClass = ViewModel.extend({
                    autoParseBinds: true
                });
            }
            args = {
                el: $el
            };
            if (options.options) {
                _.forOwn(options.options, function (value, key) {
                    args[key] = ViewModel.evil(value, context, addArgs)();
                });
            }

            vm = new ViewModelClass(args);
            if (options.name) {
                context[options.name] = vm;
            }

            return false;
        },
        $click: function ($el, value, context, addArgs) {
            $el.click(this.evil(value, context, addArgs));
            return false;
        }
    };
    var bindSplitter = /\s*;\s*/,
        firstColonRegex = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*$/,
        commaSplitter = /\s*,\s*/,
        dataBind = function (name, $el, value, context, addArgs) {
            $el.removeAttr(name);
            var newCtx, breakContextIsSent;
            if (value) {

                _.each(value.split(bindSplitter), function (cBind) {
                    var arr = cBind.match(firstColonRegex), bindName, bindVal, bindFn;
                    if (!arr) {
                        bindName = cBind;
                        bindVal = '';
                    } else {
                        bindName = arr[1];
                        bindVal = arr[2];
                    }

                    bindName = bindName.split(commaSplitter);

                    _.each(bindName, function (ccBind) {
                        if (ccBind && ccBind.charAt(0) !== '!') {
                            bindFn = ViewModel.binds[ccBind];

                            if (bindFn) {
                                newCtx = bindFn.call(ViewModel, $el, bindVal, context, addArgs);

                                if (newCtx === false) {
                                    breakContextIsSent = true;
                                } else if (newCtx) {
                                    context = newCtx;
                                }
                            } else {
                                console.warn('Bind: "' + ccBind + '" not exists');
                            }
                        }
                    });
                });
            }
            if (breakContextIsSent) {
                return false;
            }
            //console.log(newCtx);
            return context;
        };


    ViewModel.tag = function (tagName, behavior) {
        document.createElement(tagName);// for IE
        ViewModel.tags[tagName] = behavior;
    };
    ViewModel.removeTag = function (tagName) {
        delete ViewModel.tags[tagName];
    };
    ViewModel.tags = {};

    ViewModel.customAttributes = {
        'data-bind': function ($el, value, context, addArgs) {
            return dataBind('data-bind', $el, value, context, addArgs);
        },
        'nk': function ($el, value, context, addArgs) {
            return dataBind('nk', $el, value, context, addArgs);
        }
    };


    Model.filters._sysEmpty = {
        format: zeroEmpty
    };

    ViewModel.inlineModificators = {
        '{{}}': function (textNode, context) {
            var str = textNode.nodeValue,
                parent,
                docFragment,
                div,
                nodeList = [textNode],
                breakersRegex = ViewModel.inlineModificators['{{}}'].regex;
            breakersRegex.lastIndex = 0;

            if (breakersRegex.test(str)) {

                var parts = str.split(breakersRegex), deps = [], code = "return ";

                _.each(parts, function (word, index) {
                    if (index % 2) {
                        word += ' | _sysEmpty';

                        var f = Model.parseFilters(word);
                        word = _.foldl(f.filters, function (value, options, name) {
                            var opt = '';
                            if (options !== undefined) {
                                opt = ', "' + options + '"';
                            }
                            return 'Model.filters.' + name + '.format(' + value + opt + ')';
                        }, f.value);
                        deps.push(f.value);

                        code += word + '+';
                    } else {
                        code += '"' + word + '"+';
                    }
                });
                code += '"";';

                code = code.replace(/\n/g, '\\n\\\n');


                parent = textNode.parentNode;
                //$el = $(parent);
                div = document.createElement('div');


                var insertFunction = parent.childNodes.length === 1 ? function (value) {
                    //if this is the only child
                    try {
                        parent.innerHTML = value;
                    } catch (e) {
                        console.log(e);
                    }

                } : function (value) {

                    docFragment = document.createDocumentFragment();

                    try {
                        div.innerHTML = value;
                    } catch (e) {
                        console.log(e);
                    }


                    var newNodeList = _.toArray(div.childNodes), firstNode;


                    firstNode = nodeList[0];

                    while (nodeList[1]) {
                        parent.removeChild(nodeList[1]);
                        nodeList.splice(1, 1);
                    }


                    if (!newNodeList.length) {
                        firstNode.nodeValue = '';
                        nodeList = [firstNode];
                        return;
                    }


                    while (div.childNodes[0]) {
                        docFragment.appendChild(div.childNodes[0]);
                    }


                    if (docFragment.childNodes.length) {
                        try {
                            parent.insertBefore(docFragment, firstNode);
                        } catch (er) {
                            throw  er;
                        }
                    }

                    parent.removeChild(firstNode);
                    nodeList = newNodeList;

                };
                var name;
                ViewModel.replaceable(context, function (newModel) {

                    name = _.uniqueId('vmDynamicComputed');

                    try {
                        var func = new Function(deps.join(','), code);
                    } catch (e) {
                        console.log(e);
                        console.log(code);
                    }

                    newModel.addComputed(name, {
                        deps: deps,
                        get: func
                    });

                    newModel.on('change:' + name, insertFunction);
                    insertFunction(context.prop(name));
                }, function (oldModel) {
                    oldModel.removeComputed(name);
                    oldModel.off('change:' + name, insertFunction);
                });


            }

        }
    };
    ViewModel.inlineModificators['{{}}'].regex = /\{\{([\s\S]+?)\}\}/g;


}());
