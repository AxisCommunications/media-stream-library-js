import { MessageType, } from '../message';
import { messageFromBuffer } from '../../utils/protocols/sdp';
import { bodyOffset, extractHeaderValue } from '../../utils/protocols/rtsp';
/**
 * The different possible internal parser states.
 */
var STATE;
(function (STATE) {
    STATE[STATE["IDLE"] = 0] = "IDLE";
    STATE[STATE["INTERLEAVED"] = 1] = "INTERLEAVED";
    STATE[STATE["RTSP"] = 2] = "RTSP";
})(STATE || (STATE = {}));
var INTERLEAVED_HEADER_BYTES = 4;
var ASCII_DOLLAR = 0x24;
/**
 * Extract packet information from the interleaved header
 * (4-byte section before the RTP packet).
 * @param  {Array} chunks Buffers constituting the data.
 * @return {Object}       Packet information (channel, begin, end).
 */
var rtpPacketInfo = function (chunks) {
    var header = Buffer.alloc(INTERLEAVED_HEADER_BYTES);
    var i = 0;
    var bytesRead = 0;
    while (bytesRead < header.length) {
        var chunk = chunks[i++];
        var bytesToRead = Math.min(chunk.length, header.length - bytesRead);
        chunk.copy(header, bytesRead, 0, bytesToRead);
        bytesRead += bytesToRead;
    }
    var channel = header[1];
    var begin = header.length;
    var length = header.readUInt16BE(2);
    var end = begin + length;
    return { channel: channel, begin: begin, end: end };
};
/**
 * Parser class with a public method that takes a data chunk and
 * returns an array of RTP/RTSP/RTCP message objects. The parser
 * keeps track of the added chunks internally in an array and only
 * concatenates chunks when data is needed to construct a message.
 * @type {[type]}
 */
var Parser = /** @class */ (function () {
    /**
     * Create a new Parser object.
     * @return {undefined}
     */
    function Parser() {
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
    Parser.prototype._init = function () {
        this._chunks = [];
        this._length = 0;
        this._state = STATE.IDLE;
    };
    Parser.prototype._push = function (chunk) {
        this._chunks.push(chunk);
        this._length += chunk.length;
    };
    /**
     * Extract RTSP messages.
     * @return {Array} An array of messages, possibly empty.
     */
    Parser.prototype._parseRtsp = function () {
        var messages = [];
        var buffer = Buffer.concat(this._chunks);
        var chunkBodyOffset = bodyOffset(buffer);
        // If last added chunk does not have the end of the header, return.
        if (chunkBodyOffset === -1) {
            return messages;
        }
        var rtspHeaderLength = chunkBodyOffset;
        var contentLength = extractHeaderValue(buffer, 'Content-Length');
        if (contentLength &&
            parseInt(contentLength) > buffer.length - rtspHeaderLength) {
            // we do not have the whole body
            return messages;
        }
        this._init(); // resets this._chunks and this._length
        if (rtspHeaderLength === buffer.length ||
            buffer[rtspHeaderLength] === ASCII_DOLLAR) {
            // No body in this chunk, assume there is no body?
            var packet = buffer.slice(0, rtspHeaderLength);
            messages.push({ type: MessageType.RTSP, data: packet });
            // Add the remaining data to the chunk stack.
            var trailing = buffer.slice(rtspHeaderLength);
            this._push(trailing);
        }
        else {
            // Body is assumed to be the remaining data of the last chunk.
            var packet = buffer;
            var body = buffer.slice(rtspHeaderLength);
            messages.push({ type: MessageType.RTSP, data: packet });
            messages.push(messageFromBuffer(body));
        }
        return messages;
    };
    /**
     * Extract RTP/RTCP messages.
     * @return {Array} An array of messages, possibly empty.
     */
    Parser.prototype._parseInterleaved = function () {
        var messages = [];
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
        var buffer = Buffer.concat(this._chunks);
        var packet = buffer.slice(this._packet.begin, this._packet.end);
        var trailing = buffer.slice(this._packet.end);
        var channel = this._packet.channel;
        delete this._packet;
        // Prepare next bit.
        this._init();
        this._push(trailing);
        // Extract messages
        if (channel % 2 === 0) {
            // Even channels 0, 2, ...
            messages.push({ type: MessageType.RTP, data: packet, channel: channel });
        }
        else {
            // Odd channels 1, 3, ...
            var rtcpPackets = packet;
            do {
                // RTCP packets can be packed together, unbundle them:
                var rtcpByteSize = rtcpPackets.readUInt16BE(2) * 4 + 4;
                messages.push({
                    type: MessageType.RTCP,
                    data: rtcpPackets.slice(0, rtcpByteSize),
                    channel: channel,
                });
                rtcpPackets = rtcpPackets.slice(rtcpByteSize);
            } while (rtcpPackets.length > 0);
        }
        return messages;
    };
    /**
     * Set the internal state based on the type of the first chunk
     * @param {[type]} chunk [description]
     */
    Parser.prototype._setState = function () {
        // Remove leading 0-sized chunks.
        while (this._chunks.length > 0 && this._chunks[0].length === 0) {
            this._chunks.shift();
        }
        var firstChunk = this._chunks[0];
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
            throw new Error("Unknown chunk of length " + firstChunk.length);
        }
    };
    /**
     * Add the next chunk of data to the parser and extract messages.
     * If no message can be extracted, an empty array is returned, otherwise
     * an array of messages is returned.
     * @param  {Buffer} chunk The next piece of data.
     * @return {Array}        An array of messages, possibly empty.
     */
    Parser.prototype.parse = function (chunk) {
        this._push(chunk);
        if (this._state === STATE.IDLE) {
            this._setState();
        }
        var messages = [];
        var done = false;
        while (!done) {
            var extracted = [];
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
    };
    return Parser;
}());
export { Parser };
//# sourceMappingURL=parser.js.map