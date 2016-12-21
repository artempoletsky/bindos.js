$ = function (selector) {
    return document.querySelector(selector);
};
$$ = function (selector) {
    return document.querySelectorAll(selector);
};

$.extend = function (o1, ...objects) {
    for (let i = 0; i < objects.length; i++) {
        let o2 = objects[i];
        for (let key in o2) {
            o1[key] = o2[key];
        }
    }
    return o1;
};


$.extend(HTMLElement.prototype, {
    on(event, delegate, callback) {
        if (!callback) {
            this.addEventListener(event, delegate);
            return this;
        }
        var self = this;
        self.addEventListener(event, function (e) {
            var currentTarget = e.target;
            while (currentTarget != self) {
                if (currentTarget.matches(delegate)) {
                    e.delegate = currentTarget;
                    callback.call(self, e, currentTarget);
                    break;
                }
                currentTarget = currentTarget.parentNode;
            }
        });
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
(function () {
    let isReady = false;
    let uniq = {};
    $.extend($, {
        mapValues(object, iterator, context){
            let result = {};
            for (let key in object) {
                if (object.hasOwnProperty(key)) {
                    result[key] = iterator.call(context, object[key], key, object);
                }
            }
            return result;
        },
        uniqueId(prefix){
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
        },
        ready(cb) {
            if (isReady) {
                cb();
                return;
            }
            $.once(document, 'DOMContentLoaded', function () {
                isReady = true;
                cb();
            });
        },
        once(el, event, cb) {
            el.addEventListener(event, function tempCall() {
                el.removeEventListener(event, tempCall);
                cb.apply(this, arguments);
            });
        },
        make(tag) {
            return document.createElement(tag);
        }
    });
}());