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
                if (!rawTemplate) {
                    throw  new Error('Raw tempalte: "' + rawTemplateName + '" is not defined');
                }
                compiledTemplates[rawTemplateName] = template = constructorFunction(rawTemplate);
            }
            return template;
        }
    };

    ViewModel.binds.template = function (elem, value) {
        var $el = $(elem);
        rawTemplates[value] = $el.html();
        $el.remove();
        return false;
    };

}());