export interface ConfigOptions {
    [key: string]: any;
}
/**
 * Flat merge of objects, ignoring undefined override values.
 * @param  {Object} template The object with default values
 * @param  {Object} override The object with override values.
 * @return {Object}          The template object with override merged in.
 */
export declare const merge: <T extends ConfigOptions>(template: T, override: T) => T;
