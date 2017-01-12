(function () {

    var bindos = window.bindos = {
        extract() {
            let classes = ['Class', 'EventDispatcher', 'Model', 'Collection', 'ViewModel', 'Widget'];
            for (let className of classes) {
                window[className] = bindos[className];
            }
        }
    };

    var hasNoJquery = !window.$;

    bindos.hasJquery = !hasNoJquery;
    if (hasNoJquery) {
        var $ = window.$ = document.querySelector.bind(document);
        var $$ = window.$$ = document.querySelectorAll.bind(document);

        $.extend = function (o1, ...objects) {
            for (let obj of objects) {
                for (let key in obj) {
                    o1[key] = obj[key];
                }
            }
            return o1;
        };

    }


    const eventSplitter = /\s+/;


    $.extend(HTMLElement.prototype, {
        empty() {
            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }
        },
        index() {
            return Array.from(this.parentNode.children).indexOf(this);
        },
        on(event, callback, delegate) {
            let self = this;
            let off = [];

            event.split(eventSplitter).forEach((event) => {

                if (!delegate) {
                    self.addEventListener(event, callback);
                    off.push([event, callback]);
                    return;
                }

                let cb = function (e) {
                    let currentTarget = e.target;
                    while (currentTarget != self) {
                        if (currentTarget.matches(delegate)) {
                            e.delegate = currentTarget;
                            callback.call(self, e, currentTarget);
                            break;
                        }
                        currentTarget = currentTarget.parentNode;
                    }
                };
                self.addEventListener(event, cb);
                off.push([event, cb]);
            });
            return off;
        },
        off(event, callback) {
            let self = this;
            event.split(eventSplitter).forEach((event) => {
                self.removeEventListener(event, callback);
            });
        },
        fire(eventName, data = {
            bubbles: true,
            cancelable: true,
            view: window
        }) {
            let event = new Event(eventName, data);
            this.dispatchEvent(event);
            return this;
        },
        $: HTMLElement.prototype.querySelector,
        $$: HTMLElement.prototype.querySelectorAll,
        switchClassTo(className) {
            var cur = $('.' + className);
            if (cur) {
                cur.classList.remove(className);
            }
            this.classList.add(className);
            return this;
        }
    });


    let uniq = {};
    $.extend($, {
        forIn(object, callback, context){
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    callback.call(context, object[key], key, object);
                }
            }
        },
        parse(html, returnTextNodes) {
            let div = $.make('div');
            div.innerHTML = html;
            let result;
            if (returnTextNodes) {
                result = div.childNodes;
            } else {
                result = div.children;
            }
            if (result.length == 1) {
                return result[0];
            } else if (result.length == 0) {
                return undefined;
            }
            return result;
        },
        mapValues(object, iterator, context) {
            let result = {};
            for (let key in object) {
                if (object.hasOwnProperty(key)) {
                    result[key] = iterator.call(context, object[key], key, object);
                }
            }
            return result;
        },
        uniqueId(prefix) {
            if (!uniq[prefix]) {
                uniq[prefix] = 0;
            }
            return prefix + (uniq[prefix]++);
        },
        whileAsync(cond, callback, ready) {
            if (typeof ready != "function") {
                throw 'Ready callback is undefiend';
            }
            if (cond()) {
                callback(function () {
                    $.whileAsync(cond, callback, ready);
                });
            } else {
                ready();
            }
        },
        defaults(o1, o2) {
            for (let key in o2) {
                if (!(key in o1)) {
                    o1[key] = o2[key];
                }
            }
            return o1;
        },
        make: document.createElement.bind(document)
    });

    if (hasNoJquery) {

        let isReady = false;
        let readyCallbacks = [];
        document.addEventListener('DOMContentLoaded', () => {
            isReady = true;
            readyCallbacks.forEach((cb) => cb());
            readyCallbacks = undefined;
        })
        $.extend($, {
            ready(cb) {
                if (isReady) {
                    cb();
                } else {
                    readyCallbacks.push(cb);
                }
            },
            ajax(options) {
                var xhr = new XMLHttpRequest();

                if (!options.method) options.method = 'GET';
                if (options.async === undefined) options.async = true;

                xhr.open(options.method, options.url, options.async);
                for (let key in options.headers) {
                    xhr.setRequestHeader(key, options.headers[key]);
                }

                var promise;
                xhr.onreadystatechange = function () {
                    //console.log(xhr);
                    if (xhr.readyState == 4) {
                        var data = JSON.parse(xhr.responseText);
                        if (promise) {
                            promise(data);
                        }
                        if (options.success) {
                            options.success(data);
                        }
                    }
                };
                xhr.send();
                return {
                    then: function (success) {
                        promise = success;
                    }
                }
            }
        });
    }

}());
