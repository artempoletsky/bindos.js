(function () {
    "use strict";

    let ViewModel = bindos.ViewModel;
    let Model = bindos.Model;
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
                name = $.uniqueId('vmDynamicComputed');
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
            if (callbackOld) {
                callbackOld(oldModel.prop(name));
            }
        });


        return name;
    }

    ViewModel.binds = {
        log: function (el, value, model) {
            this.applyFilters(value, model, function (val) {
                console.log(model, '.', value, '=', val);
            });
        },
        src: function (elem, value, model) {
            this.applyFilters(value, model, (val) => elem.src = val || '');
        },
        html: function (el, value, model) {
            this.applyFilters(value, model, function (val) {
                el.innerHTML = zeroEmpty(val);
            });
        },
        text: function (el, value, model) {
            this.applyFilters(value, model, function (val) {
                el.innerText = zeroEmpty(val);
            });
        },
        prop(el, value, model) {
            let options = this.parseOptionsObject(value);
            for (let key in options) {
                ((key) => {
                    value = options[key];
                    this.applyFilters(value, model, (val) => {
                        el[key] = val;
                    });
                })(key)
            }
        },
        checked(el, value, model) {
            let name = this.applyFilters(value, model, (val) => {
                el.checked = val;
            });

            el.on('change', () => {
                model.prop(name, el.checked);
            })
        },
        value: function (el, value, model) {
            var name = this.applyFilters(value, model, function (val) {
                if(el.value !=val){
                    el.value = zeroEmpty(val);    
                }

            });
            ['change', 'keyup', 'keydown'].forEach(function (event) {
                el.on(event, function () {
                    model.prop(name, el.value);
                });
            });

        },
        attr: function (el, value, context) {
            $.forIn(this.parseOptionsObject(value), function (condition, attrName) {
                ViewModel.applyFilters(condition, context, function (val) {
                    if (val !== false && val !== undefined && val !== null) {
                        el.setAttribute(attrName, val);
                    } else {
                        el.removeAttribute(attrName);
                    }
                });
            });
        },
        style: function (el, value, context) {
            $.forIn(this.parseOptionsObject(value), function (condition, style) {
                ViewModel.applyFilters(condition, context, function (val) {
                    el.style[style] = val;
                });
            });
        },
        css: function (el, value, model) {
            $.forIn(this.parseOptionsObject(value), function (condition, className) {
                ViewModel.applyFilters(condition, model, function (val) {
                    el.classList.toggle(className, val);
                });
            });
        },
        display: function (el, value, context) {
            ViewModel.applyFilters(value, context, function (val) {
                //todo: implement for non block elements
                let visibleDisplay = 'block';
                el.style.display = val ? visibleDisplay : 'none';
            });
        },
        className: function (el, value, context) {
            var oldClassName;

            ViewModel.applyFilters(value, context, function (className) {
                if (oldClassName) {
                    el.classList.remove(oldClassName);
                }
                if (className) {
                    el.classList.add(className);
                }
                oldClassName = className;
            });
        },
        view: function (el, value, context, addArgs) {
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
                el: el
            };
            if (options.options) {
                $.forIn(options.options, function (value, key) {
                    args[key] = ViewModel.evil(value, context, addArgs)();
                });
            }

            vm = new ViewModelClass(args);
            if (options.name) {
                context[options.name] = vm;
            }

            return false;
        }
    };
    var bindSplitter = /\s*;\s*/,
        firstColonRegex = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*$/,
        commaSplitter = /\s*,\s*/,
        dataBind = function (name, el, value, context, addArgs) {
            el.removeAttribute(name);
            var newCtx, breakContextIsSent;
            if (value) {
                let binds = value.split(bindSplitter);
                for (let cBind of binds) {
                    var arr = cBind.match(firstColonRegex),
                        bindName, bindVal, bindFn;
                    if (!arr) {
                        bindName = cBind;
                        bindVal = '';
                    } else {
                        bindName = arr[1];
                        bindVal = arr[2];
                    }

                    bindName = bindName.split(commaSplitter);

                    for (let ccBind of bindName) {
                        if (ccBind && ccBind.charAt(0) !== '!') {
                            bindFn = ViewModel.binds[ccBind];

                            if (bindFn) {
                                newCtx = bindFn.call(ViewModel, el, bindVal, context, addArgs);

                                if (newCtx === false) {
                                    breakContextIsSent = true;
                                } else if (newCtx) {
                                    context = newCtx;
                                }
                            } else {
                                console.warn('Bind: "' + ccBind + '" not exists');
                            }
                        }
                    }
                }
            }
            if (breakContextIsSent) {
                return false;
            }
            //console.log(newCtx);
            return context;
        };


    ViewModel.bindSelectors = {
        '[data-bind]': function (el, context) {
            return dataBind('data-bind', el, el.getAttribute('data-bind'), context);
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

                var parts = str.split(breakersRegex),
                    deps = [],
                    code = "return ";

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


                    var newNodeList = _.toArray(div.childNodes),
                        firstNode;


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
                            throw er;
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
                    insertFunction(newModel.prop(name));
                }, function (oldModel) {
                    oldModel.removeComputed(name);
                    oldModel.off('change:' + name, insertFunction);
                });


            }

        }
    };
    ViewModel.inlineModificators['{{}}'].regex = /\{\{([\s\S]+?)\}\}/g;


}());
