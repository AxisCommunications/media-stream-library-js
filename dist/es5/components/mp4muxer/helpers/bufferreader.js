/**
 * Defines functions for reading from a binary buffer. Works similair to the
 * DataView object, but uses bitshifts instead for performance.
 * @class BufferReader
 * @constructor
 * @param {ArrayBuffer} buffer An ArrayBuffer to be read from.
 */
var BufferReader = /** @class */ (function () {
    function BufferReader(buffer) {
        this._buffer = buffer;
        this._dataView = new DataView(this._buffer);
        this._offset = 0;
        this._bitpos = 0;
        this._byte = 0;
    }
    /**
     * Reads 8-bit of data from the buffer.
     * @method readUint8
     * @param  {Number} offset Index in the buffer.
     * @return {Number} An unsigned 8-bit integer.
     */
    BufferReader.prototype.readUint8 = function (offset) {
        return this._dataView.getUint8(offset);
    };
    /**
     * Reads 16-bit of data from the buffer.
     * @method readUint16
     * @param  {Number} offset Index in the buffer.
     * @return {Number} An unsigned 16-bit integer.
     */
    BufferReader.prototype.readUint16 = function (offset) {
        return this._dataView.getUint16(offset);
    };
    /**
     * Reads 32-bit of data from the buffer.
     * @method readUint32
     * @param  {Number} offset Index in the buffer.
     * @return {Number} An unsigned 32-bit integer.
     */
    BufferReader.prototype.readUint32 = function (offset) {
        return this._dataView.getUint32(offset);
    };
    /**
     * Reads the next byte of data from the buffer and increaments the offset.
     * @method readNext
     * @return {Number} An unsigned 8-bit integer.
     */
    BufferReader.prototype.readNext = function () {
        var value = this.readUint8(this._offset);
        this._offset += 1;
        return value;
    };
    BufferReader.prototype.readBits = function (length) {
        if (length > 32 || length === 0) {
            throw new Error('length has to be between 0 - 31 bits');
        }
        var result = 0;
        for (var i = 1; i <= length; ++i) {
            if (this._bitpos === 0) {
                /* Previous byte all read out. Get a new one. */
                this._byte = this.readNext();
            }
            /* Shift result one left to make room for another bit,
            then add the next bit on the stream. */
            result = (result << 1) | ((this._byte >> (8 - ++this._bitpos)) & 0x01);
            this._bitpos %= 8;
        }
        return result;
    };
    BufferReader.prototype.readUnsignedExpGolomb = function () {
        var bitsToRead = 0;
        while (this.readBits(1) !== 1) {
            bitsToRead++;
        }
        if (bitsToRead === 0) {
            return 0; /* Easy peasy, just a single 1. This is 0 in exp golomb */
        }
        if (bitsToRead >= 31) {
            throw new Error('read unsigned exponential Golomb: internal error');
        }
        /* Read all bits part of this number */
        var n = this.readBits(bitsToRead);
        /* Move in the 1 read by while-statement above */
        n |= 0x1 << bitsToRead;
        return n - 1; /* Because result in exp golomb is one larger */
    };
    BufferReader.prototype.readSignedExpGolomb = function () {
        var r = this.readUnsignedExpGolomb();
        if (r & 0x01) {
            r = (r + 1) >> 1;
        }
        else {
            r = -(r >> 1);
        }
        return r;
    };
    /**
     * Returns the size of the buffer
     * @method readSize
     * @return {Number} The buffer size.
     */
    BufferReader.prototype.size = function () {
        return this._buffer.byteLength;
    };
    /**
     * Returns an instance of the buffer as an unsigned 8-bit integer array.
     * @method getUint8Array
     * @return {Uint8Array} Unsigned 8-bit integer representation of the buffer
     */
    BufferReader.prototype.getUint8Array = function () {
        return new Uint8Array(this._buffer);
    };
    /**
     * Returns the buffer object
     * @method getArrayBuffer
     * @return {ArrayBuffer} The buffer used the BufferReader
     */
    BufferReader.prototype.getArrayBuffer = function () {
        return this._buffer;
    };
    return BufferReader;
}());
export { BufferReader };
//# sourceMappingURL=bufferreader.js.map