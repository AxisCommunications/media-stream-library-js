"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("../message");
const sdp_1 = require("../../utils/protocols/sdp");
const rtsp_1 = require("../../utils/protocols/rtsp");
/**
 * The different possible internal parser states.
 */
var STATE;
(function (STATE) {
    STATE[STATE["IDLE"] = 0] = "IDLE";
    STATE[STATE["INTERLEAVED"] = 1] = "INTERLEAVED";
    STATE[STATE["RTSP"] = 2] = "RTSP";
})(STATE || (STATE = {}));
const INTERLEAVED_HEADER_BYTES = 4;
const ASCII_DOLLAR = 0x24;
/**
 * Extract packet information from the interleaved header
 * (4-byte section before the RTP packet).
 * @param  {Array} chunks Buffers constituting the data.
 * @return {Object}       Packet information (channel, begin, end).
 */
const rtpPacketInfo = (chunks) => {
    const header = Buffer.alloc(INTERLEAVED_HEADER_BYTES);
    let i = 0;
    let bytesRead = 0;
    while (bytesRead < header.length) {
        const chunk = chunks[i++];
        const bytesToRead = Math.min(chunk.length, header.length - bytesRead);
        chunk.copy(header, bytesRead, 0, bytesToRead);
        bytesRead += bytesToRead;
    }
    const channel = header[1];
    const begin = header.length;
    const length = header.readUInt16BE(2);
    const end = begin + length;
    return { channel, begin, end };
};
/**
 * Parser class with a public method that takes a data chunk and
 * returns an array of RTP/RTSP/RTCP message objects. The parser
 * keeps track of the added chunks internally in an array and only
 * concatenates chunks when data is needed to construct a message.
 * @type {[type]}
 */
class Parser {
    /**
     * Create a new Parser object.
     * @return {undefined}
     */
    constructor() {
        this._chunks = [];
        this._length = 0;
        this._state = STATE.IDLE;
        this._init();
    }
    /**
     * Initialize the internal properties to their default starting
     * values.
     * @return {undefined}
     */
    _init() {
        this._chunks = [];
        this._length = 0;
        this._state = STATE.IDLE;
    }
    _push(chunk) {
        this._chunks.push(chunk);
        this._length += chunk.length;
    }
    /**
     * Extract RTSP messages.
     * @return {Array} An array of messages, possibly empty.
     */
    _parseRtsp() {
        const messages = [];
        const buffer = Buffer.concat(this._chunks);
        const chunkBodyOffset = rtsp_1.bodyOffset(buffer);
        // If last added chunk does not have the end of the header, return.
        if (chunkBodyOffset === -1) {
            return messages;
        }
        const rtspHeaderLength = chunkBodyOffset;
        const contentLength = rtsp_1.extractHeaderValue(buffer, 'Content-Length');
        if (contentLength &&
            parseInt(contentLength) > buffer.length - rtspHeaderLength) {
            // we do not have the whole body
            return messages;
        }
        this._init(); // resets this._chunks and this._length
        if (rtspHeaderLength === buffer.length ||
            buffer[rtspHeaderLength] === ASCII_DOLLAR) {
            // No body in this chunk, assume there is no body?
            const packet = buffer.slice(0, rtspHeaderLength);
            messages.push({ type: message_1.MessageType.RTSP, data: packet });
            // Add the remaining data to the chunk stack.
            const trailing = buffer.slice(rtspHeaderLength);
            this._push(trailing);
        }
        else {
            // Body is assumed to be the remaining data of the last chunk.
            const packet = buffer;
            const body = buffer.slice(rtspHeaderLength);
            messages.push({ type: message_1.MessageType.RTSP, data: packet });
            messages.push(sdp_1.messageFromBuffer(body));
        }
        return messages;
    }
    /**
     * Extract RTP/RTCP messages.
     * @return {Array} An array of messages, possibly empty.
     */
    _parseInterleaved() {
        const messages = [];
        // Skip as long as we don't have the first 4 bytes
        if (this._length < INTERLEAVED_HEADER_BYTES) {
            return messages;
        }
        // Enough bytes to construct the header and extract packet info.
        if (!this._packet) {
            this._packet = rtpPacketInfo(this._chunks);
        }
        // As long as we don't have enough chunks, skip.
        if (this._length < this._packet.end) {
            return messages;
        }
        // We have enough data to extract the packet.
        const buffer = Buffer.concat(this._chunks);
        const packet = buffer.slice(this._packet.begin, this._packet.end);
        const trailing = buffer.slice(this._packet.end);
        const channel = this._packet.channel;
        delete this._packet;
        // Prepare next bit.
        this._init();
        this._push(trailing);
        // Extract messages
        if (channel % 2 === 0) {
            // Even channels 0, 2, ...
            messages.push({ type: message_1.MessageType.RTP, data: packet, channel });
        }
        else {
            // Odd channels 1, 3, ...
            let rtcpPackets = packet;
            do {
                // RTCP packets can be packed together, unbundle them:
                const rtcpByteSize = rtcpPackets.readUInt16BE(2) * 4 + 4;
                messages.push({
                    type: message_1.MessageType.RTCP,
                    data: rtcpPackets.slice(0, rtcpByteSize),
                    channel,
                });
                rtcpPackets = rtcpPackets.slice(rtcpByteSize);
            } while (rtcpPackets.length > 0);
        }
        return messages;
    }
    /**
     * Set the internal state based on the type of the first chunk
     * @param {[type]} chunk [description]
     */
    _setState() {
        // Remove leading 0-sized chunks.
        while (this._chunks.length > 0 && this._chunks[0].length === 0) {
            this._chunks.shift();
        }
        const firstChunk = this._chunks[0];
        if (this._chunks.length === 0) {
            this._state = STATE.IDLE;
        }
        else if (firstChunk[0] === ASCII_DOLLAR) {
            this._state = STATE.INTERLEAVED;
        }
        else if (firstChunk.toString('ascii', 0, 4) === 'RTSP') {
            this._state = STATE.RTSP;
        }
        else {
            throw new Error(`Unknown chunk of length ${firstChunk.length}`);
        }
    }
    /**
     * Add the next chunk of data to the parser and extract messages.
     * If no message can be extracted, an empty array is returned, otherwise
     * an array of messages is returned.
     * @param  {Buffer} chunk The next piece of data.
     * @return {Array}        An array of messages, possibly empty.
     */
    parse(chunk) {
        this._push(chunk);
        if (this._state === STATE.IDLE) {
            this._setState();
        }
        let messages = [];
        let done = false;
        while (!done) {
            let extracted = [];
            switch (this._state) {
                case STATE.IDLE:
                    break;
                case STATE.INTERLEAVED:
                    extracted = this._parseInterleaved();
                    break;
                case STATE.RTSP:
                    extracted = this._parseRtsp();
                    break;
                default:
                    throw new Error('internal error: unknown state');
            }
            if (extracted.length > 0) {
                messages = messages.concat(extracted);
            }
            else {
                done = true;
            }
            this._setState();
        }
        return messages;
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map