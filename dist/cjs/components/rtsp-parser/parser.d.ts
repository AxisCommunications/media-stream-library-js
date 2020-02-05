/// <reference types="node" />
import { RtspMessage, SdpMessage, RtpMessage, RtcpMessage } from '../message';
/**
 * Parser class with a public method that takes a data chunk and
 * returns an array of RTP/RTSP/RTCP message objects. The parser
 * keeps track of the added chunks internally in an array and only
 * concatenates chunks when data is needed to construct a message.
 * @type {[type]}
 */
export declare class Parser {
    private _chunks;
    private _length;
    private _state;
    private _packet?;
    /**
     * Create a new Parser object.
     * @return {undefined}
     */
    constructor();
    /**
     * Initialize the internal properties to their default starting
     * values.
     * @return {undefined}
     */
    _init(): void;
    _push(chunk: Buffer): void;
    /**
     * Extract RTSP messages.
     * @return {Array} An array of messages, possibly empty.
     */
    _parseRtsp(): Array<RtspMessage | SdpMessage>;
    /**
     * Extract RTP/RTCP messages.
     * @return {Array} An array of messages, possibly empty.
     */
    _parseInterleaved(): Array<RtpMessage | RtcpMessage>;
    /**
     * Set the internal state based on the type of the first chunk
     * @param {[type]} chunk [description]
     */
    _setState(): void;
    /**
     * Add the next chunk of data to the parser and extract messages.
     * If no message can be extracted, an empty array is returned, otherwise
     * an array of messages is returned.
     * @param  {Buffer} chunk The next piece of data.
     * @return {Array}        An array of messages, possibly empty.
     */
    parse(chunk: Buffer): Array<SdpMessage | RtspMessage | RtpMessage | RtcpMessage>;
}
