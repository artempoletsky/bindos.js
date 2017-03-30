(function () {
    let Handler = bindos.Handler = Class.extend({
        parseOptionsObject: function (value) {
            var parsedSimpleObjects = {},
                result,
                i = 0,
                recursiveParse = function (string) {
                    if (string.match(/\{[^{}]*\}/)) {
                        recursiveParse(string.replace(/\{[^{}]*\}/, function (string) {

                            var name = Math.random() + i++;
                            parsedSimpleObjects[name] = parsePairs(string.slice(1, -1));
                            return name;
                        }));
                    }
                };
            recursiveParse(value);

            for (let key in parsedSimpleObjects) {
                let object = parsedSimpleObjects[key];
                for (let key2 in object) {
                    let value = object[key2];
                    if (parsedSimpleObjects[value]) {
                        object[key2] = parsedSimpleObjects[value];
                        delete parsedSimpleObjects[value];
                    }
                }
            }
            for (let key in parsedSimpleObjects) {
                result = parsedSimpleObjects[key];
            }

            if (!result) {
                throw new Error(value + ' is not valid options object');
            }
            return result;
        },
        getExpression() {

        },
        constructor(el, model) {
            this.el = el;
            this.model = model;
            this.bind(el, model, this.getExpression());
        },
        update(el, val) {

        },
        bind(el, model, expr) {
            this.applyFilters(model, expr, this.update);
        },
        unbind() {

        }
    });
    bindos.handlers = {};

    bindos.addHandler = function (name, proto) {
        bindos.handlers[name] = new bindos.Handler(proto);
    };

}());
