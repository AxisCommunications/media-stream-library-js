/// <reference types="node" />
import { BufferReader } from './bufferreader';
/**
 * Defines functions for writing to a binary buffer.
 * @class BufferWriter
 * @constructor
 * @param {Number} size The size of the buffer.
 */
export declare class SPSParser {
    reader: BufferReader;
    constructor(buffer: Buffer);
    parse(): {
        profile: number;
        level: number;
        width: number;
        height: number;
    };
}
