import { concat, decode, readUInt16BE } from 'utils/bytes'
import { rtcpMessageFromBuffer } from '../../utils/protocols/rtcp'
import { bodyOffset, extractHeaderValue } from '../../utils/protocols/rtsp'
import { sdpFromBody } from '../../utils/protocols/sdp'
import { MessageType } from '../message'
import type {
  RtcpMessage,
  RtpMessage,
  RtspMessage,
  SdpMessage,
} from '../message'

/**
 * The different possible internal parser states.
 */
enum STATE {
  IDLE = 0,
  INTERLEAVED = 1,
  RTSP = 2,
}

const INTERLEAVED_HEADER_BYTES = 4
const ASCII_DOLLAR = 0x24

interface RtpPacketInfo {
  channel: number
  begin: number
  end: number
}

/**
 * Extract packet information from the interleaved header
 * (4-byte section before the RTP packet).
 * @param  chunks - Buffers constituting the data.
 * @return Packet information (channel, begin, end).
 */
const rtpPacketInfo = (chunks: Uint8Array[]): RtpPacketInfo => {
  const header = new Uint8Array(INTERLEAVED_HEADER_BYTES)
  let i = 0
  let bytesRead = 0

  while (bytesRead < header.length) {
    const chunk = chunks[i++]
    const bytesToRead = Math.min(chunk.length, header.length - bytesRead)
    header.set(chunk.subarray(0, bytesToRead), bytesRead)
    bytesRead += bytesToRead
  }
  const channel = header[1]
  const begin = header.length
  const length = readUInt16BE(header, 2)
  const end = begin + length

  return { channel, begin, end }
}

/**
 * Parser class with a public method that takes a data chunk and
 * returns an array of RTP/RTSP/RTCP message objects. The parser
 * keeps track of the added chunks internally in an array and only
 * concatenates chunks when data is needed to construct a message.
 * @type {[type]}
 */
export class Parser {
  private _chunks: Uint8Array[] = []
  private _length = 0
  private _state: STATE = STATE.IDLE
  private _packet?: RtpPacketInfo

  /**
   * Create a new Parser object.
   * @return {undefined}
   */
  constructor() {
    this._init()
  }

  /**
   * Initialize the internal properties to their default starting
   * values.
   * @return {undefined}
   */
  _init() {
    this._chunks = []
    this._length = 0
    this._state = STATE.IDLE
  }

  _push(chunk: Uint8Array) {
    this._chunks.push(chunk)
    this._length += chunk.length
  }

  /**
   * Extract RTSP messages.
   * @return {Array} An array of messages, possibly empty.
   */
  _parseRtsp(): Array<RtspMessage | SdpMessage> {
    const messages: Array<RtspMessage | SdpMessage> = []

    const data = concat(this._chunks)
    const chunkBodyOffset = bodyOffset(data)
    // If last added chunk does not have the end of the header, return.
    if (chunkBodyOffset === -1) {
      return messages
    }

    const rtspHeaderLength = chunkBodyOffset

    const dec = new TextDecoder()
    const header = dec.decode(data.subarray(0, rtspHeaderLength))

    const contentLength = extractHeaderValue(header, 'Content-Length')
    if (
      contentLength &&
      Number.parseInt(contentLength) > data.length - rtspHeaderLength
    ) {
      // we do not have the whole body
      return messages
    }

    this._init() // resets this._chunks and this._length

    if (
      rtspHeaderLength === data.length ||
      data[rtspHeaderLength] === ASCII_DOLLAR
    ) {
      // No body in this chunk, assume there is no body?
      const packet = data.subarray(0, rtspHeaderLength)
      // FIXME: update after GenericMessage uses Uint8Array for data
      messages.push({ type: MessageType.RTSP, data: Buffer.from(packet) })

      // Add the remaining data to the chunk stack.
      const trailing = data.subarray(rtspHeaderLength)
      this._push(trailing)
    } else {
      // Body is assumed to be the remaining data of the last chunk.
      const body = data.subarray(rtspHeaderLength)

      // FIXME: update after GenericMessage uses Uint8Array for data
      messages.push({ type: MessageType.RTSP, data: Buffer.from(data) })
      messages.push(sdpFromBody(decode(body)))
    }

    return messages
  }

  /**
   * Extract RTP/RTCP messages.
   * @return {Array} An array of messages, possibly empty.
   */
  _parseInterleaved(): Array<RtpMessage | RtcpMessage> {
    const messages: Array<RtpMessage | RtcpMessage> = []

    // Skip as long as we don't have the first 4 bytes
    if (this._length < INTERLEAVED_HEADER_BYTES) {
      return messages
    }

    // Enough bytes to construct the header and extract packet info.
    if (!this._packet) {
      this._packet = rtpPacketInfo(this._chunks)
    }

    // As long as we don't have enough chunks, skip.
    if (this._length < this._packet.end) {
      return messages
    }

    // We have enough data to extract the packet.
    const buffer = concat(this._chunks)
    const packet = buffer.subarray(this._packet.begin, this._packet.end)
    const trailing = buffer.subarray(this._packet.end)
    const channel = this._packet.channel

    this._packet = undefined

    // Prepare next bit.
    this._init()
    this._push(trailing)

    // Extract messages
    if (channel % 2 === 0) {
      // Even channels 0, 2, ...
      messages.push({
        type: MessageType.RTP,
        // FIXME: update after GenericMessage uses Uint8Array for data
        data: Buffer.from(packet),
        channel,
      })
    } else {
      // Odd channels 1, 3, ...
      let rtcpPackets = packet
      do {
        // RTCP packets can be packed together, unbundle them:
        const rtcpByteSize = readUInt16BE(rtcpPackets, 2) * 4 + 4
        messages.push(
          rtcpMessageFromBuffer(channel, rtcpPackets.slice(0, rtcpByteSize))
        )
        rtcpPackets = rtcpPackets.slice(rtcpByteSize)
      } while (rtcpPackets.length > 0)
    }

    return messages
  }

  /**
   * Set the internal state based on the type of the first chunk
   */
  _setState() {
    // Remove leading 0-sized chunks.
    while (this._chunks.length > 0 && this._chunks[0].length === 0) {
      this._chunks.shift()
    }

    const firstChunk = this._chunks[0]

    if (this._chunks.length === 0) {
      this._state = STATE.IDLE
    } else if (firstChunk[0] === ASCII_DOLLAR) {
      this._state = STATE.INTERLEAVED
    } else if (decode(firstChunk).startsWith('RTSP')) {
      this._state = STATE.RTSP
    } else {
      throw new Error(`Unknown chunk of length ${firstChunk.length}`)
    }
  }

  /**
   * Add the next chunk of data to the parser and extract messages.
   * If no message can be extracted, an empty array is returned, otherwise
   * an array of messages is returned.
   * @param  chunk - The next piece of data.
   * @return An array of messages, possibly empty.
   */
  parse(
    chunk: Uint8Array
  ): Array<SdpMessage | RtspMessage | RtpMessage | RtcpMessage> {
    this._push(chunk)

    if (this._state === STATE.IDLE) {
      this._setState()
    }

    let messages: Array<SdpMessage | RtspMessage | RtpMessage | RtcpMessage> =
      []
    let done = false

    while (!done) {
      let extracted: Array<
        SdpMessage | RtspMessage | RtpMessage | RtcpMessage
      > = []
      switch (this._state) {
        case STATE.IDLE:
          break
        case STATE.INTERLEAVED:
          extracted = this._parseInterleaved()
          break
        case STATE.RTSP:
          extracted = this._parseRtsp()
          break
        default:
          throw new Error('internal error: unknown state')
      }

      if (extracted.length > 0) {
        messages = messages.concat(extracted)
      } else {
        done = true
      }

      this._setState()
    }

    return messages
  }
}
