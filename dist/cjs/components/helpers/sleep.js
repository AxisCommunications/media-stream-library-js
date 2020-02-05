"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Return a promise that resolves after a specific time.
 * @param  {Number}  ms Waiting time in milliseconds
 * @return {Promise}    Resolves after waiting time
 */
exports.sleep = (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};
//# sourceMappingURL=sleep.js.map