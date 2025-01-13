import { concat, decode, readUInt16BE } from '../utils/bytes'

import { RtcpMessage } from '../types/rtcp'
import { RtpMessage } from '../types/rtp'
import { RtspResponseMessage } from '../types/rtsp'

import { bodyOffset, parseResponse } from './header'
import { parseRtcp } from './rtcp'
import { parseRtp } from './rtp'

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
 * RTSP Parser
 *
 * Provides a parse method that takes a data chunk and
 * returns an array of RTP/RTSP/RTCP message objects. The parser
 * keeps track of the added chunks internally in an array and only
 * concatenates chunks when data is needed to construct a message.
 */
export class RtspParser {
  private chunks: Uint8Array[] = []
  private length = 0
  private state: STATE = STATE.IDLE
  private packet?: RtpPacketInfo

  constructor() {
    this.init()
  }

  // Initialize the internal properties to their default starting values.
  private init() {
    this.chunks = []
    this.length = 0
    this.state = STATE.IDLE
  }

  // Add a chunk of data to the internal stack.
  private push(chunk: Uint8Array) {
    this.chunks.push(chunk)
    this.length += chunk.length
  }

  // Extract an RTSP message from the internal stack.
  private parseRtsp(): Array<RtspResponseMessage> {
    const data = concat(this.chunks)
    const chunkBodyOffset = bodyOffset(data)
    // If last added chunk does not have the end of the header, return.
    if (chunkBodyOffset === -1) {
      return []
    }

    const rtspHeaderLength = chunkBodyOffset

    const dec = new TextDecoder()
    const startAndHeader = dec.decode(data.subarray(0, rtspHeaderLength))
    const { statusCode, headers } = parseResponse(startAndHeader)

    const contentLength = headers.get('content-length')
    if (
      contentLength &&
      Number.parseInt(contentLength) > data.length - rtspHeaderLength
    ) {
      // we do not have the whole body
      return []
    }

    this.init()

    if (
      rtspHeaderLength === data.length ||
      data[rtspHeaderLength] === ASCII_DOLLAR
    ) {
      // No body in this chunk, assume there is no body?
      // Add the remaining data to the chunk stack.
      const trailing = data.subarray(rtspHeaderLength)
      this.push(trailing)

      return [new RtspResponseMessage({ statusCode, headers })]
    }

    // Body is assumed to be the remaining data of the last chunk.
    const body = data.subarray(rtspHeaderLength)

    return [new RtspResponseMessage({ statusCode, headers, body })]
  }

  // Extract RTP/RTCP messages from the internal stack.
  private parseInterleaved(): Array<RtpMessage | RtcpMessage> {
    const messages: Array<RtpMessage | RtcpMessage> = []

    // Skip as long as we don't have the first 4 bytes
    if (this.length < INTERLEAVED_HEADER_BYTES) {
      return messages
    }

    // Enough bytes to construct the header and extract packet info.
    if (!this.packet) {
      this.packet = rtpPacketInfo(this.chunks)
    }

    // As long as we don't have enough chunks, skip.
    if (this.length < this.packet.end) {
      return messages
    }

    // We have enough data to extract the packet.
    const buffer = concat(this.chunks)
    const packet = buffer.subarray(this.packet.begin, this.packet.end)
    const trailing = buffer.subarray(this.packet.end)
    const channel = this.packet.channel

    this.packet = undefined

    // Prepare next bit.
    this.init()
    this.push(trailing)

    // Extract messages
    if (channel % 2 === 0) {
      // Even channels 0, 2, ...
      messages.push(new RtpMessage({ channel, ...parseRtp(packet) }))
    } else {
      // Odd channels 1, 3, ...
      let rtcpPackets = packet
      do {
        // RTCP packets can be packed together, unbundle them:
        const rtcpByteSize = readUInt16BE(rtcpPackets, 2) * 4 + 4
        const packet = rtcpPackets.subarray(0, rtcpByteSize)

        messages.push(new RtcpMessage({ channel, rtcp: parseRtcp(packet) }))

        rtcpPackets = rtcpPackets.subarray(rtcpByteSize)
      } while (rtcpPackets.length > 0)
    }

    return messages
  }

  // Set the internal state based on the type of the first chunk
  private setState() {
    // Remove leading 0-sized chunks.
    while (this.chunks.length > 0 && this.chunks[0].length === 0) {
      this.chunks.shift()
    }

    const firstChunk = this.chunks[0]

    if (this.chunks.length === 0) {
      this.state = STATE.IDLE
    } else if (firstChunk[0] === ASCII_DOLLAR) {
      this.state = STATE.INTERLEAVED
    } else if (decode(firstChunk).startsWith('RTSP')) {
      this.state = STATE.RTSP
    } else {
      throw new Error(`Unknown chunk of length ${firstChunk.length}`)
    }
  }

  /**
   * Add the next chunk of data to the parser and extract messages.
   * If no message can be extracted, an empty array is returned, otherwise
   * an array of messages is returned.
   */
  public parse(
    chunk: Uint8Array
  ): Array<RtspResponseMessage | RtpMessage | RtcpMessage> {
    this.push(chunk)

    if (this.state === STATE.IDLE) {
      this.setState()
    }

    let messages: Array<RtspResponseMessage | RtpMessage | RtcpMessage> = []
    let done = false

    while (!done) {
      let extracted: Array<RtspResponseMessage | RtpMessage | RtcpMessage> = []
      switch (this.state) {
        case STATE.IDLE:
          break
        case STATE.INTERLEAVED:
          extracted = this.parseInterleaved()
          break
        case STATE.RTSP:
          extracted = this.parseRtsp()
          break
        default:
          throw new Error('internal error: unknown state')
      }

      if (extracted.length > 0) {
        messages = messages.concat(extracted)
      } else {
        done = true
      }

      this.setState()
    }

    return messages
  }
}
