import registerDebug from 'debug'

import { MessageType, IsomMessage } from '../message'
import { BOX_HEADER_BYTES, boxType } from '../../utils/protocols/isom'
import { Container } from '../mp4muxer/helpers/isom'

const debug = registerDebug('msl:mp4-parser')

// Identify boxes that conforms to an ISO BMFF byte stream:
//  - header boxes: ftyp + moov
//  - segment boxes: [stype] + moof + mdat + [[mdat]...]
const ISO_BMFF_BOX_TYPES = new Set(['ftyp', 'moov', 'styp', 'moof', 'mdat'])

interface Mp4BoxInfo {
  type: string
  size: number
}

/**
 * Extract type and size information from the box header
 * (8-byte section at beginning of the box).
 */
const mp4BoxInfo = (chunks: Buffer[]): Mp4BoxInfo => {
  const header = Buffer.alloc(BOX_HEADER_BYTES)
  let i = 0
  let bytesRead = 0

  while (bytesRead < header.length) {
    const chunk = chunks[i++]
    const bytesToRead = Math.min(chunk.length, header.length - bytesRead)
    chunk.copy(header, bytesRead, 0, bytesToRead)
    bytesRead += bytesToRead
  }

  const size = header.readUInt32BE(0)
  const type = boxType(header)

  return { type, size }
}

/**
 * Parser class with a public method that takes a data chunk and returns the
 * next box, or null of there is no complete box. The parser keeps track of the
 * added chunks internally in an array and only concatenates chunks when data is
 * needed to construct a message.
 * @type {[type]}
 */
export class Parser {
  private _chunks: Buffer[] = []
  private _length = 0
  private _box?: Mp4BoxInfo
  private _ftyp?: Buffer

  /**
   * Create a new Parser object.
   */
  constructor() {
    this._init()
  }

  /**
   * Initialize the internal properties to their default starting
   * values.
   */
  _init(): void {
    this._chunks = []
    this._length = 0
  }

  _push(chunk: Buffer): void {
    this._chunks.push(chunk)
    this._length += chunk.length
  }

  /**
   * Extract MP4 boxes.
   * @return {Array} An array of messages, possibly empty.
   */
  _parseBox(): Buffer | null {
    // Skip as long as we don't have the first 8 bytes
    if (this._length < BOX_HEADER_BYTES) {
      return null
    }

    // Enough bytes to construct the header and extract packet info.
    if (!this._box) {
      this._box = mp4BoxInfo(this._chunks)
    }

    // As long as we don't have enough chunks, skip.
    if (this._length < this._box.size) {
      return null
    }

    // We have enough data to extract a box.
    // The buffer package has a problem that it doesn't optimize concatenation
    // of an array with only one buffer, check for that (prevents performance issue)
    const buffer =
      this._chunks.length === 1 ? this._chunks[0] : Buffer.concat(this._chunks)
    const box = buffer.slice(0, this._box.size)
    const trailing = buffer.slice(this._box.size)

    // Prepare next bit.
    this._init()
    this._push(trailing)

    // Ignore invalid boxes
    if (!ISO_BMFF_BOX_TYPES.has(this._box.type)) {
      console.warn(
        `ignored non-ISO BMFF Byte Stream box type: ${this._box.type} (${this._box.size} bytes)`,
      )
      return Buffer.alloc(0)
    }

    delete this._box

    return box
  }

  /**
   * Add the next chunk of data to the parser and extract messages.
   * If no message can be extracted, an empty array is returned, otherwise
   * an array of messages is returned.
   * @param  {Buffer} chunk The next piece of data.
   * @return {Array}        An array of messages, possibly empty.
   */
  parse(chunk: Buffer): IsomMessage[] {
    this._push(chunk)

    const messages: IsomMessage[] = []
    let done = false

    while (!done) {
      const data = this._parseBox()

      if (data !== null) {
        if (boxType(data) === 'ftyp') {
          this._ftyp = data
        } else if (boxType(data) === 'moov') {
          const moov = new Container('moov')
          const tracks = moov.parse(data)
          debug('MP4 tracks: ', tracks)
          messages.push({
            type: MessageType.ISOM,
            data: Buffer.concat([this._ftyp ?? Buffer.alloc(0), data]),
            tracks,
          })
        } else {
          messages.push({ type: MessageType.ISOM, data })
        }
      } else {
        done = true
      }
    }

    return messages
  }
}
