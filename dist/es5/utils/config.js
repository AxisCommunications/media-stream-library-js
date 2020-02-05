/**
 * Flat merge of objects, ignoring undefined override values.
 * @param  {Object} template The object with default values
 * @param  {Object} override The object with override values.
 * @return {Object}          The template object with override merged in.
 */
export var merge = function (template, override) {
    var cleanOverride;
    if (override !== undefined) {
        if (typeof override !== 'object') {
            throw new Error('merge expects override to be an object!');
        }
        else {
            cleanOverride = Object.keys(override).reduce(function (acc, key) {
                if (override[key] !== undefined) {
                    acc[key] = override[key];
                }
                return acc;
            }, {});
        }
    }
    return Object.assign({}, template, cleanOverride);
};
//# sourceMappingURL=config.js.map