/// <reference types="node" />
/**
 * Defines functions for reading from a binary buffer. Works similair to the
 * DataView object, but uses bitshifts instead for performance.
 * @class BufferReader
 * @constructor
 * @param {ArrayBuffer} buffer An ArrayBuffer to be read from.
 */
export declare class BufferReader {
    private _buffer;
    private _dataView;
    private _offset;
    private _bitpos;
    private _byte;
    constructor(buffer: Buffer);
    /**
     * Reads 8-bit of data from the buffer.
     * @method readUint8
     * @param  {Number} offset Index in the buffer.
     * @return {Number} An unsigned 8-bit integer.
     */
    readUint8(offset: number): number;
    /**
     * Reads 16-bit of data from the buffer.
     * @method readUint16
     * @param  {Number} offset Index in the buffer.
     * @return {Number} An unsigned 16-bit integer.
     */
    readUint16(offset: number): number;
    /**
     * Reads 32-bit of data from the buffer.
     * @method readUint32
     * @param  {Number} offset Index in the buffer.
     * @return {Number} An unsigned 32-bit integer.
     */
    readUint32(offset: number): number;
    /**
     * Reads the next byte of data from the buffer and increaments the offset.
     * @method readNext
     * @return {Number} An unsigned 8-bit integer.
     */
    readNext(): number;
    readBits(length: number): number;
    readUnsignedExpGolomb(): number;
    readSignedExpGolomb(): number;
    /**
     * Returns the size of the buffer
     * @method readSize
     * @return {Number} The buffer size.
     */
    size(): number;
    /**
     * Returns an instance of the buffer as an unsigned 8-bit integer array.
     * @method getUint8Array
     * @return {Uint8Array} Unsigned 8-bit integer representation of the buffer
     */
    getUint8Array(): Uint8Array;
    /**
     * Returns the buffer object
     * @method getArrayBuffer
     * @return {ArrayBuffer} The buffer used the BufferReader
     */
    getArrayBuffer(): Buffer;
}
