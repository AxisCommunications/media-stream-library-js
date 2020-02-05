/**
 * Return a promise that resolves after a specific time.
 * @param  {Number}  ms Waiting time in milliseconds
 * @return {Promise}    Resolves after waiting time
 */
export var sleep = function (ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
};
//# sourceMappingURL=sleep.js.map