/**
 * Return a promise that resolves after a specific time.
 * @param  ms Waiting time in milliseconds
 * @return Resolves after waiting time
 */
export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
