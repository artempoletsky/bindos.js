/*globals ViewModel, $, _, Computed, Observable*/
(function () {
    "use strict";
    var filtersSplitter = /\s*\|\s*/;
    var filtersSplitter2 = /(\w+)(:['"]([^'"]+)['"])?/;

    ViewModel.filters = {};

    ViewModel.applyFilters = function (value, context, addArgs, $el) {
        var filters = value.split(filtersSplitter);
        if (filters.length <= 1) {
            return this.findObservable(value, context, addArgs, $el);
        }
        value = filters.shift();
        var computed = this.findObservable(value, context, addArgs, $el);
        filters = _.foldl(filters, function (result, string) {
            var matches = filtersSplitter2.exec(string);
            var key = matches[1];
            result.push({
                unformat: ViewModel.filters[key].unformat,
                format: ViewModel.filters[key].format,
                key: key,
                value: matches[3] || ''
            });
            return result;
        }, []);
        return Computed({
            get: function () {
                return _.foldl(filters, function (result, obj) {
                    return obj.format.call(ViewModel, result, obj.value);
                }, computed.get());
            },
            set: function (value) {
                computed.set(_.foldr(filters, function (result, obj) {
                    return obj.unformat.call(ViewModel, result, obj.value);
                }, value));
            }
        }).obj;
    };

    ViewModel.binds = {
        log: function ($el, value, context, addArgs) {
            this.findObservable(value, context, addArgs, $el).callAndSubscribe(function (val) {
                console.log(context, '.', value, '=', val);
            });
        },
        src: function ($el, value, context, addArgs) {
            var elem = $el[0];
            this.findObservable(value, context, addArgs, $el)
                .callAndSubscribe(function (val) {
                    elem.src = val || '';
                });
        },
        html: function ($el, value, context, addArgs) {
            //var elem=$el[0];
            //var filters = this.filtersOut(value);
            //console.log(value);
            this.applyFilters(value, context, addArgs, $el)
                .callAndSubscribe(function (val) {
                    //undefined конвертируется в пустую строку
                    if (!val && typeof val != 'number') {
                        val = '';
                    }
                    $el.html(val);
                });
        },
        text: function ($el, value, context, addArgs) {
            this.findObservable(value, context, addArgs, $el)
                .callAndSubscribe(function (val) {
                    $el.text(val);
                });
        },
        'with': function ($el, value, context, addArgs) {
            return this.evil(value, context, addArgs)();
        },
        each: function ($el, value, context, addArgs) {
            var fArray = this.findObservable(value, context, addArgs, $el),
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
            var obs = this.findObservable(value, context, addArgs, $el)
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
                ViewModel.findObservable(condition, context, addArgs, $el)
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


    ViewModel.filters._sysUnwrap = {
        format: function (value) {
            if (Observable.isObservable(value)) {
                return value();
            }
            return value;
        }
    };

    ViewModel.filters._sysEmpty = {
        format: function (value) {
            return value || (value === 0 ? '0' : '');
        }
    };

    ViewModel.inlineModificators = {
        '{{}}': function (textNode, context, addArgs) {
            var str = textNode.nodeValue,
                vm = this,
                parent,
                docFragment,
                div,
                nodeList = [textNode],
                breakersRegex = ViewModel.inlineModificators['{{}}'].regex;
            breakersRegex.lastIndex = 0;
            if (breakersRegex.test(str)) {

                parent = textNode.parentNode;
                div = document.createElement('div');


                var i = 0;

                var ctx = {

                };
                breakersRegex.lastIndex = 0;

                str = '"' + str.replace(breakersRegex, function (exprWithBreakers, expr) {

                    i++;
                    ctx['___comp' + i] = vm.applyFilters(expr + ' | _sysUnwrap | _sysEmpty', context, addArgs).getter;
                    return '"+___comp' + i + '()+"';
                }) + '"';

                vm.findObservable(str, ctx, addArgs, $(parent)).callAndSubscribe(parent.childNodes.length == 1 ? function (value) {
                        //if this is the only child
                        parent.innerHTML = value;
                    } : function (value) {

                        docFragment = document.createDocumentFragment();
                        div.innerHTML = value;

                        var newNodeList = _.toArray(div.childNodes), firstNode;


                        firstNode = nodeList[0];

                        while (nodeList[1]) {
                            parent.removeChild(nodeList[1]);
                            nodeList.splice(1, 1);
                        }



                        if (!newNodeList.length) {
                            firstNode.textContent = '';
                            nodeList = [firstNode];
                            return;
                        }


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

                        parent.removeChild(firstNode);
                        nodeList = newNodeList;

                    });



            }

        }
    };
    ViewModel.inlineModificators['{{}}'].regex = /\{\{([\s\S]+?)\}\}/g;


}());
