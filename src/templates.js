(function () {
    "use strict";
    /*globals _, ViewModel, $*/
    var rawTemplates = {},
        compiledTemplates = {};
    /**
     * Объект для работы с темплейтами
     * @type {{Object}}
     */
    ViewModel.tmpl = {
        setRawTemplate: function (name, html) {
            rawTemplates[name] = html;
        },
        /**
         * Возвращает сырой текстовый темплейт по имени
         * @param name {String} имя темплейта
         * @returns {String} текстовое представление темплейта
         */
        getRawTemplate: function (name) {
            return rawTemplates[name];
        },
        /**
         * Если есть возвращает скомпилированный темплейт,
         * если нет создает его с помощью constructorFunction
         * @param {String} rawTemplateName
         * @param {function} constructorFunction
         * @returns {function}
         */
        get: function (rawTemplateName, constructorFunction) {
            var template = compiledTemplates[rawTemplateName],
                rawTemplate;
            if (!template) {
                rawTemplate = rawTemplates[rawTemplateName];
                if (rawTemplate === undefined) {
                    throw  new Error('Raw template: "' + rawTemplateName + '" is not defined');
                }
                compiledTemplates[rawTemplateName] = template = constructorFunction(rawTemplate);
            }
            return template;
        }
    };

    ViewModel.binds.template = function (elem, value, context, addArgs) {
        var $el = $(elem), splt = value.split(/\s*,\s*/), name = splt[0], constuctor = splt[1];

        rawTemplates[name] = $el.html();
        $el.remove();
        if (constuctor) {
            constuctor = this.evil(constuctor, context, addArgs);
            compiledTemplates[name] = constuctor(rawTemplates[name]);
        }
        return false;
    };

}());