/**
 * Return a promise that resolves after a specific time.
 * @param  ms Waiting time in milliseconds
 * @return Resolves after waiting time
 */
export const sleep = async (ms: number) => {
  return await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
