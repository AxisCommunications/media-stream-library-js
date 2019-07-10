export interface ConfigOptions {
  [key: string]: any
}

/**
 * Flat merge of objects, ignoring undefined override values.
 * @param  {Object} template The object with default values
 * @param  {Object} override The object with override values.
 * @return {Object}          The template object with override merged in.
 */
export const merge = <T extends ConfigOptions>(template: T, override: T): T => {
  let cleanOverride
  if (override !== undefined) {
    if (typeof override !== 'object') {
      throw new Error('merge expects override to be an object!')
    } else {
      cleanOverride = Object.keys(override).reduce(
        (acc: ConfigOptions, key) => {
          if (override[key] !== undefined) {
            acc[key] = override[key]
          }
          return acc
        },
        {},
      )
    }
  }
  return Object.assign({}, template, cleanOverride)
}
