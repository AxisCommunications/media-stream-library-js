/**
 * Return a promise that resolves after a specific time.
 * @param  {Number}  ms Waiting time in milliseconds
 * @return {Promise}    Resolves after waiting time
 */
export const sleep = (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};
//# sourceMappingURL=sleep.js.map