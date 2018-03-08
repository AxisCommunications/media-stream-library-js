/**
 * Return a promise that resolves after a specific time.
 * @param  {Number}  ms Waiting time in milliseconds
 * @return {Promise}    Resolves after waiting time
 */
const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

module.exports = sleep
