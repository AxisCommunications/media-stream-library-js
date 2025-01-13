/**
 * Defines functions for reading from a binary buffer. Works similair to the
 * DataView object, but uses bitshifts instead for performance.
 * @class BufferReader
 * @constructor
 * @param buffer - An ArrayBuffer to be read from.
 */
export class BufferReader {
  private readonly dataView: DataView
  private offset: number
  private bitpos: number
  private byte: number

  constructor(bytes: Uint8Array) {
    this.dataView = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength
    )
    this.offset = 0
    this.bitpos = 0
    this.byte = 0
  }

  /**
   * Reads 8-bit of data from the buffer.
   * @method readUint8
   * @param  offset - Index in the buffer.
   * @return An unsigned 8-bit integer.
   */
  readUint8(offset: number) {
    return this.dataView.getUint8(offset)
  }

  /**
   * Reads 16-bit of data from the buffer.
   * @method readUint16
   * @param  offset - Index in the buffer.
   * @return An unsigned 16-bit integer.
   */
  readUint16(offset: number) {
    return this.dataView.getUint16(offset)
  }

  /**
   * Reads 32-bit of data from the buffer.
   * @method readUint32
   * @param  offset - Index in the buffer.
   * @return An unsigned 32-bit integer.
   */
  readUint32(offset: number) {
    return this.dataView.getUint32(offset)
  }

  /** Reads the next byte of data from the buffer and increaments the offset. */
  readNext() {
    const value = this.readUint8(this.offset)
    this.offset += 1
    return value
  }

  readBits(length: number) {
    if (length > 32 || length === 0) {
      throw new Error('length has to be between 0 - 31 bits')
    }

    let result = 0
    for (let i = 1; i <= length; ++i) {
      if (this.bitpos === 0) {
        /* Previous byte all read out. Get a new one. */
        this.byte = this.readNext()
      }
      /* Shift result one left to make room for another bit,
      then add the next bit on the stream. */
      result = (result << 1) | ((this.byte >> (8 - ++this.bitpos)) & 0x01)
      this.bitpos %= 8
    }

    return result
  }

  readUnsignedExpGolomb() {
    let bitsToRead = 0
    while (this.readBits(1) !== 1) {
      bitsToRead++
    }

    if (bitsToRead === 0) {
      return 0 /* Easy peasy, just a single 1. This is 0 in exp golomb */
    }

    if (bitsToRead >= 31) {
      throw new Error('read unsigned exponential Golomb: internal error')
    }

    /* Read all bits part of this number */
    let n = this.readBits(bitsToRead)
    /* Move in the 1 read by while-statement above */
    n |= 0x1 << bitsToRead

    return n - 1 /* Because result in exp golomb is one larger */
  }

  readSignedExpGolomb() {
    let r = this.readUnsignedExpGolomb()
    if (r & 0x01) {
      r = (r + 1) >> 1
    } else {
      r = -(r >> 1)
    }
    return r
  }
}
