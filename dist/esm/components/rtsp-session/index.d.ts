import { Tube } from '../component';
import { RtspMessage, RtcpMessage, RtpMessage, SdpMessage } from '../message';
import { Sdp } from '../../utils/protocols/sdp';
export declare enum RTSP_METHOD {
    OPTIONS = "OPTIONS",
    DESCRIBE = "DESCRIBE",
    SETUP = "SETUP",
    PLAY = "PLAY",
    PAUSE = "PAUSE",
    TEARDOWN = "TEARDOWN"
}
interface Headers {
    [key: string]: string;
}
interface Command {
    method: RTSP_METHOD;
    headers?: Headers;
    uri?: string;
}
interface MethodHeaders {
    [key: string]: Headers;
}
export interface RtspConfig {
    hostname?: string;
    parameters?: string[];
    uri?: string;
    headers?: MethodHeaders;
    defaultHeaders?: Headers;
}
/**
 * A component that sets up a command queue in order to interact with the RTSP
 * server. Allows control over the RTSP session by listening to incoming messages
 * and sending request on the outgoing stream.
 *
 * The following handlers can be set on the component:
 *  - onSdp: will be called when an SDP object is sent with the object as argument
 *  - onPlay: will be called when an RTSP PLAY response is sent with the media range
 *            as argument. The latter is an array [start, stop], where start is "now"
 *            (for live) or a time in seconds, and stop is undefined (for live or
 *            ongoing streams) or a time in seconds.
 * @extends {Component}
 */
export declare class RtspSession extends Tube {
    uri?: string;
    headers?: MethodHeaders;
    defaultHeaders?: Headers;
    t0?: {
        [key: number]: number;
    };
    n0?: {
        [key: number]: number;
    };
    clockrates?: {
        [key: number]: number;
    };
    startTime?: number;
    onSdp?: (sdp: Sdp) => void;
    onError?: (err: Error) => void;
    onPlay?: (range?: string[]) => void;
    private _outgoingClosed;
    private _sequence?;
    private _retry?;
    private _callStack?;
    private _callHistory?;
    private _state?;
    private _waiting?;
    private _contentBase?;
    private _sessionId?;
    private _renewSessionInterval?;
    /**
     * Create a new RTSP session controller component.
     * @param  {Object} [config={}] Details about the session.
     * @param  {String} [config.hostname] The RTSP server hostname
     * @param  {String[]} [config.parameters] The RTSP URI parameters
     * @param  {String} [config.uri] The full RTSP URI (overrides any hostname/parameters)
     * @param  {Object} [config.defaultHeaders] Default headers to use (for all methods).
     * @param  {Object} [config.headers] Headers to use (mapped to each method).
     * @return {undefined}
     */
    constructor(config?: RtspConfig);
    /**
     * Update the cached RTSP uri and headers.
     * @param  {String} uri                 The RTSP URI.
     * @param  {Object} headers             Maps commands to headers.
     * @param  {Object} [defaultHeaders={}] Default headers.
     * @return {[type]}                     [description]
     */
    update(uri: string | undefined, headers?: MethodHeaders, defaultHeaders?: Headers): void;
    /**
     * Restore the initial values to the state they were in before any RTSP
     * connection was made.
     */
    _reset(): void;
    /**
     * Handles incoming RTSP messages and send the next command in the queue.
     * @param  {Object} msg An incoming RTSP message.
     * @return {undefined}
     */
    _onRtsp(msg: RtspMessage): void;
    _onRtcp(msg: RtcpMessage): void;
    _onRtp(msg: RtpMessage): void;
    /**
     * Handles incoming SDP messages, reply with SETUP and optionally PLAY.
     * @param  {Object} msg An incoming SDP message.
     * @return {undefined}
     */
    _onSdp(msg: SdpMessage): void;
    /**
     * Set up command queue in order to start playing, i.e. PLAY optionally
     * preceeded by OPTIONS/DESCRIBE commands. If not waiting, immediately
     * start sending.
     * @param  {Number} startTime Time (seconds) at which to start playing
     * @return {undefined}
     */
    play(startTime?: number): void;
    /**
     * Queue a pause command, and send if not waiting.
     * @return {undefined}
     */
    pause(): void;
    /**
     * End the session if there is one, otherwise just cancel
     * any outstanding calls on the stack.
     * @return {undefined}
     */
    stop(): void;
    /**
     * Pushes an RTSP request onto the outgoing stream.
     * @param  {Object} options The details about the command to send.
     * @return {undefined}
     */
    send(cmd: Command): void;
    /**
     * Push one or more commands onto the call stack.
     * @param  {...Object} commands One or more commands.
     * @return {undefined}
     */
    _enqueue(cmd: Command): void;
    /**
     * If possible, send the next command on the call stack.
     * @return {undefined}
     */
    _dequeue(): void;
}
export {};
