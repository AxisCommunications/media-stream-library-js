/// <reference types="node" />
declare type BufferMutation = (buffer: Buffer, offset: number) => void;
declare abstract class BoxElement {
    byteLength: number;
    value: any;
    abstract copy(buffer: Buffer, offset: number): void;
    abstract load(buffer: Buffer, offset: number): void;
    constructor(size: number);
}
/**
 * Box class.
 *
 * Defines a box as an entity similar to a C struct, where the struct is
 * represented by a Map of elements.
 * Each element is an object with at least:
 *  - a 'byteLength' property (size of element in bytes)
 *  - a 'copy' method (BufferMutation signature)
 */
export declare class Box extends BoxElement {
    type: string;
    config: {
        [key: string]: any;
    };
    struct: Map<string, {
        offset: number;
        element: {
            value?: any;
            byteLength: number;
            copy: BufferMutation;
            load?: BufferMutation;
            format?: (indent?: number) => string;
        };
    }>;
    /**
     * Create a new Box.
     * @param  {String} type   4-character ASCII string
     * @param  {Object} config Configuration holding (key: value) fields
     */
    constructor(type: string, config?: {
        [key: string]: any;
    });
    /**
     * Get access to an element based on it's name.
     * @param  {String} key The element's name
     * @return {Element}    Object with 'byteLength' property and 'copy' method
     */
    element(key: string): {
        value?: any;
        byteLength: number;
        copy: BufferMutation;
        load?: BufferMutation | undefined;
        format?: ((indent?: number | undefined) => string) | undefined;
    };
    /**
     * Set an element's value.
     * @param  {String} key The element's name
     * @param  {Number|Array} value The element's (new) value
     * @return {undefined}
     */
    set(key: string, value: any): void;
    /**
     * Get an element's value.
     * @param  {String} key The element's name
     * @return {Number|Array}  The element's value
     */
    get(key: string): any;
    /**
     * Get an element's offset.
     * @param  {String} key The element's name
     * @return {Number}  The element's offset
     */
    offset(key: string): number;
    /**
     * Check if a certain element exists
     * @param  {String}  key The element's name
     * @return {Boolean}     true if the element is known, false if not
     */
    has(key: string): boolean;
    /**
     * Add a new element to the box.
     * @param {String} key     A _new_ non-existing element name.
     * @param {Object} element Something with a 'byteLength' property and 'copy' method.
     * @return {Box} this box, so that 'add' can be used in a chain
     */
    add(key: string, element: BoxElement | Buffer): this;
    /**
     * Create a buffer and copy all element values to it.
     * @return {Buffer} Data representing the box.
     */
    buffer(): Buffer;
    /**
     * Copy all values of the box into an existing buffer.
     * @param  {Buffer} buffer     The target buffer to accept the box data
     * @param  {Number} [offset=0] The number of bytes into the target to start at.
     * @return {undefined}
     */
    copy(buffer: Buffer, offset?: number): void;
    /**
     * Read element values from a box's data representation.
     * @param  {buffer} buffer     The source buffer with box data
     * @param  {Number} [offset=0] The number of bytes into the source to start at.
     * @return {undefined}
     */
    load(buffer: Buffer, offset?: number): void;
    /**
     * Pretty-format an entire box as an element/box hierarchy.
     * @param  {Number} [indent=0] How large an indentation to use for the hierarchy
     * @return {undefined}
     */
    format(indent?: number): string;
    /**
     * Pretty-print an entire box as an element/box hierarchy.
     * @param  {Number} [indent=0] How large an indentation to use for the hierarchy
     * @return {undefined}
     */
    print(indent: number): void;
}
/**
 * Container class
 *
 * special box with an 'add' method which allows appending of other boxes,
 * and a 'parse' method to extract contained boxes.
 */
export declare class Container extends Box {
    boxSize: number;
    /**
     * Create a new container box
     * @param  {String} type   4-character ASCII string
     * @param  {Object} config Configuration holding (key: value) fields
     * @param  {Box} boxes  One or more boxes to append.
     */
    constructor(type: string, config?: {
        [key: string]: any;
    }, ...boxes: Box[]);
    /**
     * Add one or more boxes to the container.
     * @param {Box} boxes The box(es) to append
     * @return {Box} this container, so that add can be used in a chain
     */
    append(...boxes: Box[]): this;
    /**
     * Parse a container box by looking for boxes that it contains, and
     * recursively proceed when it is another container.
     * @param  {Buffer} data The data to parse.
     * @return {undefined}
     */
    parse(data: Buffer): void;
}
export {};
