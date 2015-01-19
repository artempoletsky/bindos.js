/*globals ViewModel, $, _, Computed, Observable, ObjectObservable*/
(function () {
    "use strict";


    var zeroEmpty = function (value) {
        return value || (value === 0 ? '0' : '');
    };

    ViewModel.applyFilters = function (value, model, callback) {
        var name;
        if (Model.hasFilters(value)) {
            name = _.uniqueId('vmDynamicComputed');
            model.addComputed(name, {
                filtersString: value
            });
        } else {
            name = value;
        }


        model.on('change:' + name, callback);
        callback(model.prop(name));
        return name;
    }

    ViewModel.binds = {
        log: function ($el, value, context, addArgs) {
            this.findCallAndSubscribe(value, context, addArgs, function (val) {
                console.log(context, '.', value, '=', val);
            }, $el);
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
            }, $el);
        },
        text: function ($el, value, context, addArgs) {
            this.findCallAndSubscribe(value, context, addArgs, function (val) {
                $el.text(val);
            }, $el);
        },
        'with': function ($el, value, context, addArgs) {
            return this.evil(value, context, addArgs)();
        },
        each: function ($el, value, model) {

            var template = $el.html();


            this.applyFilters(value, model, function (array) {
                //$el.children().clearBinds();
                $el.empty();
                var fragment = document.createDocumentFragment();
                if (array) {
                    _.each(array, function (val, ind) {
                        model.prop('$index', ind);
                        model.prop('$value', val);


                        $(template).each(function () {
                            ViewModel.findBinds(this, model);
                            fragment.appendChild(this);
                        });
                    });
                    $el[0].appendChild(fragment);
                }
            });


            return false;
        },
        value: function ($el, value, model) {
            var name = this.applyFilters(value, model, function (val) {
                $el.val(zeroEmpty(val));
            }, $el);

            $el.on('change keyup keydown', function () {
                var val = $el.val();
                //if ($el.get() !== val) {
                model.prop(name, val);
                //}
            });
        },
        attr: function ($el, value, context, addArgs) {
            var elem = $el[0];
            _.each(this.parseOptionsObject(value), function (condition, attrName) {
                ViewModel.findCallAndSubscribe(condition, context, addArgs, function (val) {
                    if (val !== false && val !== undefined && val !== null) {
                        elem.setAttribute(attrName, val);
                    } else {
                        elem.removeAttribute(attrName);
                    }
                }, $el);
            });
        },
        style: function ($el, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function (condition, style) {
                ViewModel.findObservable(condition, context, addArgs, $el)
                    .callAndSubscribe(function (value) {
                        $el.css(style, value);
                    });
            });
        },
        css: function ($el, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function (condition, className) {
                ViewModel.findObservable(condition, context, addArgs, $el)
                    .callAndSubscribe(function (value) {
                        if (value) {
                            $el.addClass(className);
                        }
                        else {
                            $el.removeClass(className);
                        }
                    });
            });
        },
        display: function ($el, value, context, addArgs) {
            this.findObservable(value, context, addArgs, $el).callAndSubscribe(function (value) {
                if (value) {
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
        className: function ($el, value, context, addArgs) {
            var oldClassName;
            this.findObservable(value, context, addArgs, $el).callAndSubscribe(function (className) {
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
        '{{}}': function (textNode, context, addArgs) {
            var str = textNode.nodeValue,
                vm = this,
                parent,
                docFragment,
                div,
                nodeList = [textNode],
                breakersRegex = ViewModel.inlineModificators['{{}}'].regex,
                $el;

            if (breakersRegex.test(str)) {

                var parts = str.split(breakersRegex), deps = [], code = "return ";

                _.each(parts, function (word, index) {
                    if (index % 2) {
                        deps.push(word);
                        code += word + '+';
                    } else {
                        code += '"' + word + '"+';
                    }
                });
                code += '""';
                var name = _.uniqueId('vmDynamicComputed');
                context.addComputed(name, {
                    deps: deps,
                    get: new Function(deps.join(','), code)
                });


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


                context.on('change:'+name, insertFunction);
                insertFunction(context.prop(name));

            }

        }
    };
    ViewModel.inlineModificators['{{}}'].regex = /\{\{([\s\S]+?)\}\}/g;


}());
