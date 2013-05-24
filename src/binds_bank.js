(function () {
    "use strict";
    /*globals ViewModel, $, _, Computed*/
    ViewModel.binds = {
        log: function ($el, value, context, addArgs) {
            this.findObservable(context, value, addArgs).callAndSubscribe(function () {
                console.log(context, '.', value, '=', this());
            });
        },
        src: function ($el, value, context, addArgs) {
            var elem=$el[0];
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    elem.src = val || '';
                });
        },
        html: function ($el, value, context, addArgs) {
            //var elem=$el[0];
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    //undefined конвертируется в пустую строку
                    /*if (!val) {
                        val = '';
                    } */
                    $el.html(val);
                });
        },
        text: function ($el, value, context, addArgs) {
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    $el.text(val);
                });
        },
        'with': function ($el, value, context, addArgs) {
            return this.evil(context, value, addArgs)();
        },
        each: function ($el, value, context, addArgs) {
            var fArray = this.findObservable(context, value, addArgs),
                html = $el.html();
            $el.empty();

            if (addArgs) {
                addArgs = _.clone(addArgs);
            }
            else {
                addArgs = {};
            }
            fArray.callAndSubscribe(function (array) {
                $el.empty();
                if (array) {
                    _.each(array, function (val, ind) {
                        addArgs.$index = ind;
                        addArgs.$parent = array;
                        addArgs.$value = val;
                        var tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        ViewModel.findBinds(tempDiv, val, addArgs);
                        $el.append($(tempDiv).children());
                    });
                }
            });

            return false;
        },
        value: function ($el, value, context, addArgs) {
            var obs = this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (value) {
                    $el.val(value);
                });
            $el.change(function () {
                obs($el.val());
            });
        },
        attr: function ($el, value, context, addArgs) {
            var elem = $el[0];
            _.each(this.parseOptionsObject(value), function (condition, attrName) {
                ViewModel.findObservable(context, condition, addArgs)
                    .callAndSubscribe(function (val) {
                        if (val !== false && val !== undefined && val != null) {
                            elem.setAttribute(attrName, val);
                        } else {
                            elem.removeAttribute(attrName);
                        }
                    });
            });
        },
        style: function ($el, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function (condition, style) {
                ViewModel.findObservable(context, condition, addArgs)
                    .callAndSubscribe(function (value) {
                        $el.css(style, value);
                    });
            });
        },
        css: function ($el, value, context, addArgs) {
            _.each(this.parseOptionsObject(value), function (condition, className) {
                ViewModel.findObservable(context, condition, addArgs)
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
            this.findObservable(context, value, addArgs).callAndSubscribe(function (value) {
                if (value) {
                    $el.show();
                }
                else {
                    $el.hide();
                }
            });
        },
        click: function ($el, value, context, addArgs) {
            var fn = this.evil(context, value, addArgs)();
            $el.click(function () {
                fn.apply(context, arguments);
            });
        },
        className: function ($el, value, context, addArgs) {
            var oldClassName;
            this.findObservable(context, value, addArgs).callAndSubscribe(function (className) {
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
                var callback = self.evil(context, expr, addArgs)();
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
                ViewModelClass = this.evil(context, options['class'], addArgs)();
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
                    args[key] = ViewModel.evil(context, value, addArgs)();
                });
            }

            vm = new ViewModelClass(args);
            if (options.name) {
                context[options.name] = vm;
            }

            return false;
        },
        $click: function ($el, value, context, addArgs) {
            var evil = this.evil(context, value, addArgs);
            $el.click(function () {
                evil();
            });
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

    ViewModel.inlineModificators = {
        '{{}}': function (textNode, context, addArgs) {
            var str = textNode.nodeValue,
                vm = this,
                evil,
                parent,
                docFragment,
                div,
                nodeList = [textNode],
                breakersRegex = ViewModel.inlineModificators['{{}}'].regex;

            if (breakersRegex.test(str)) {

                parent = textNode.parentNode;
                div = document.createElement('div');
                str=str.replace(/\n/g, '\\n');


                str = '"' + str.replace(breakersRegex, function (exprWithBreakers, expr) {
                    return '"+(' + expr + '||"")+"';
                }) + '"';


                evil = vm.evil(context, str, addArgs, true);

                Computed(function () {
                    try {
                        return evil();
                    } catch (e) {
                        return ' <span style="color: red;">' + e.message + '</span> ';
                    }
                })
                    .callAndSubscribe(function (value) {

                        docFragment = document.createDocumentFragment();
                        div.innerHTML = value;

                        var newNodeList = _.toArray(div.childNodes),firstNode;

                        if (!newNodeList.length
                            //hack for samsung smart tv 2011
                            && navigator.userAgent.toLowerCase().indexOf('maple') == -1) {
                            newNodeList = [document.createTextNode('')];
                            div.appendChild(newNodeList[0]);
                        }

                        firstNode = nodeList[0];

                        while (div.childNodes[0]) {
                            docFragment.appendChild(div.childNodes[0]);
                        }


                        if (docFragment.childNodes.length) {
                            try {
                                parent.insertBefore(docFragment, firstNode);
                            } catch (e) {
                                throw  e;
                            }
                        }


                        _.each(nodeList, function (node) {
                            parent.removeChild(node);
                        });
                        nodeList = newNodeList;

                    });

            }

        }
    };
    ViewModel.inlineModificators['{{}}'].regex = /\{\{([\s\S]+?)\}\}/g;
}());
