(function () {
    "use strict";
    /*globals ViewModel, $, _*/
    ViewModel.binds = {
        log: function (elem, value, context, addArgs) {
            this.findObservable(context, value, addArgs).callAndSubscribe(function () {
                console.log(context, '.', value, '=', this());
            });
        },
        src: function (elem, value, context, addArgs) {
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    elem.src = val || '';
                });
        },
        html: function (elem, value, context, addArgs) {
            //var $el=$(elem);
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    //undefined конвертируется в пустую строку
                    if (!val) {
                        val = '';
                    }
                    elem.innerHTML = val;
                });
        },
        text: function (elem, value, context, addArgs) {
            var $el = $(elem);
            this.findObservable(context, value, addArgs)
                .callAndSubscribe(function (val) {
                    $el.text(val);
                });
        },
        'with': function (elem, value, context, addArgs) {
            return this.findObservable(context, value, addArgs)();
        },
        each: function (elem, value, context, addArgs) {
            var fArray = this.findObservable(context, value, addArgs),
                $el = $(elem),
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
        value: function (elem, value, context, addArgs) {
            var $el = $(elem),
                obs = this.findObservable(context, value, addArgs)
                    .callAndSubscribe(function (value) {
                        $el.val(value);
                    });
            $el.change(function () {
                obs($el.val());
            });
        },
        attr: function (elem, value, context, addArgs) {
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
        style: function (elem, value, context, addArgs) {
            var $el = $(elem);
            _.each(this.parseOptionsObject(value), function (condition, style) {
                ViewModel.findObservable(context, condition, addArgs)
                    .callAndSubscribe(function (value) {
                        $el.css(style, value);
                    });
            });
        },
        css: function (elem, value, context, addArgs) {
            var $el = $(elem);
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
        display: function (elem, value, context, addArgs) {
            var $el = $(elem);
            this.findObservable(context, value, addArgs).callAndSubscribe(function (value) {
                if (value) {
                    $el.show();
                }
                else {
                    $el.hide();
                }
            });
        },
        click: function (elem, value, context, addArgs) {
            var fn = this.findObservable(context, value, addArgs)(),
                $el = $(elem);
            $el.click(function () {
                fn.apply(context, arguments);
            });
        },
        className: function (elem, value, context, addArgs) {
            var oldClassName,
                $el = $(elem);
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
        events: function (elem, value, context, addArgs) {
            var self = this,
                $el = $(elem);
            _.each(this.parseOptionsObject(value), function (expr, eventName) {
                var callback = self.findObservable(context, expr, addArgs)();
                $el.bind(eventName, function (e) {
                    callback.call(context, e);
                });
            });
        }
    };
    var bindSplitter = /\s*;\s*/,
        firstColonRegex = /^\s*([^:]+)\s*:\s*([\s\S]*\S)\s*$/,
        commaSplitter = /\s*,\s*/;

    var dataBind = function (name, $el, value, context, addArgs) {
        $el.removeAttr(name);
        var newCtx;
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
                            newCtx = bindFn.call(ViewModel, $el[0], bindVal, context, addArgs);
                        } else {
                            console.warn('Bind: "' + ccBind + '" not exists');
                        }
                    }
                });
            });
        }
        return newCtx;
    }


    ViewModel.tag = function (tagName, behavior) {
        document.createElement(tagName);// for IE
        ViewModel.tags[tagName] = behavior;
    }
    ViewModel.removeTag = function (tagName) {
        delete ViewModel.tags[tagName];
    }
    ViewModel.tags = {};

    ViewModel.customAttributes = {
        'data-bind': function ($el, value, context, addArgs) {
            return dataBind('data-bind', $el, value, context, addArgs);
        },
        'nk': function ($el, value, context, addArgs) {
            return dataBind('nk', $el, value, context, addArgs);
        }
    }

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

                        var newNodeList = _.toArray(div.childNodes);
                        var firstNode = nodeList[0];

                        while (div.childNodes[0]) {
                            docFragment.appendChild(div.childNodes[0]);
                        }

                        parent.insertBefore(docFragment, firstNode);

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
