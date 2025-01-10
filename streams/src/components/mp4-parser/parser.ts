import { Container } from '../mp4-muxer/isom'
import { mimeType } from '../mp4-muxer/mime'
import { IsomMessage } from '../types/isom'
import { concat, decode, readUInt32BE } from '../utils/bytes'

const BOX_HEADER_BYTES = 8

const boxType = (buffer: Uint8Array) => {
  return decode(buffer.subarray(4, 8)).toLowerCase()
}

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
const mp4BoxInfo = (chunks: Uint8Array[]): Mp4BoxInfo => {
  const header = new Uint8Array(BOX_HEADER_BYTES)
  let i = 0
  let bytesRead = 0

  while (bytesRead < header.length) {
    const chunk = chunks[i++]
    const bytesToRead = Math.min(chunk.length, header.length - bytesRead)
    header.set(chunk.subarray(0, bytesToRead), bytesRead)
    bytesRead += bytesToRead
  }

  const size = readUInt32BE(header, 0)
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
  private chunks: Uint8Array[] = []
  private length = 0
  private box?: Mp4BoxInfo
  private ftyp?: Uint8Array

  /**
   * Create a new Parser object.
   */
  constructor() {
    this.init()
  }

  /**
   * Initialize the internal properties to their default starting
   * values.
   */
  private init(): void {
    this.chunks = []
    this.length = 0
  }

  private push(chunk: Uint8Array): void {
    this.chunks.push(chunk)
    this.length += chunk.length
  }

  /**
   * Extract MP4 boxes.
   * @return {Array} An array of messages, possibly empty.
   */
  private parseBox(): Uint8Array | null {
    // Skip as long as we don't have the first 8 bytes
    if (this.length < BOX_HEADER_BYTES) {
      return null
    }

    // Enough bytes to construct the header and extract packet info.
    if (!this.box) {
      this.box = mp4BoxInfo(this.chunks)
    }

    // As long as we don't have enough chunks, skip.
    if (this.length < this.box.size) {
      return null
    }

    // We have enough data to extract a box.
    // The buffer package has a problem that it doesn't optimize concatenation
    // of an array with only one buffer, check for that (prevents performance issue)
    const buffer =
      this.chunks.length === 1 ? this.chunks[0] : concat(this.chunks)
    const box = buffer.slice(0, this.box.size)
    const trailing = buffer.slice(this.box.size)

    // Prepare next bit.
    this.init()
    this.push(trailing)

    // Ignore invalid boxes
    if (!ISO_BMFF_BOX_TYPES.has(this.box.type)) {
      console.warn(
        `ignored non-ISO BMFF Byte Stream box type: ${this.box.type} (${this.box.size} bytes)`
      )
      return new Uint8Array(0)
    }

    delete this.box

    return box
  }

  /**
   * Add the next chunk of data to the parser and extract messages.
   * If no message can be extracted, an empty array is returned, otherwise
   * an array of messages is returned.
   * @param  chunk - The next piece of data.
   * @return An array of messages, possibly empty.
   */
  parse(chunk: Uint8Array): IsomMessage[] {
    this.push(chunk)

    const messages: IsomMessage[] = []
    let done = false

    while (!done) {
      const data = this.parseBox()

      if (data !== null) {
        if (boxType(data) === 'ftyp') {
          this.ftyp = data
        } else if (boxType(data) === 'moov') {
          const moov = new Container('moov')
          const tracks = moov.parse(data)
          messages.push(
            new IsomMessage({
              data: concat([this.ftyp ?? new Uint8Array(0), data]),
              mimeType: mimeType(tracks),
            })
          )
        } else {
          messages.push(new IsomMessage({ data }))
        }
      } else {
        done = true
      }
    }

    return messages
  }
}
