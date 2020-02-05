var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import debug from 'debug';
import { Tube } from '../component';
import { merge } from '../../utils/config';
import { MessageType, } from '../message';
import { Transform } from 'stream';
import { statusCode, connectionEnded, sequence, sessionId, contentBase, range, sessionTimeout, } from '../../utils/protocols/rtsp';
import { packetType, SR } from '../../utils/protocols/rtcp';
import { getTime } from '../../utils/protocols/ntp';
import { timestamp } from '../../utils/protocols/rtp';
function isAbsolute(url) {
    return /^[^:]+:\/\//.test(url);
}
var STATE;
(function (STATE) {
    STATE["IDLE"] = "idle";
    STATE["PLAYING"] = "playing";
    STATE["PAUSED"] = "paused";
})(STATE || (STATE = {}));
export var RTSP_METHOD;
(function (RTSP_METHOD) {
    RTSP_METHOD["OPTIONS"] = "OPTIONS";
    RTSP_METHOD["DESCRIBE"] = "DESCRIBE";
    RTSP_METHOD["SETUP"] = "SETUP";
    RTSP_METHOD["PLAY"] = "PLAY";
    RTSP_METHOD["PAUSE"] = "PAUSE";
    RTSP_METHOD["TEARDOWN"] = "TEARDOWN";
})(RTSP_METHOD || (RTSP_METHOD = {}));
var MIN_SESSION_TIMEOUT = 5; // minimum timeout for a rtsp session in seconds
// Default RTSP configuration
var defaultConfig = function (hostname, parameters) {
    if (hostname === void 0) { hostname = typeof window === 'undefined'
        ? ''
        : window.location.hostname; }
    if (parameters === void 0) { parameters = []; }
    var uri = parameters.length > 0
        ? "rtsp://" + hostname + "/axis-media/media.amp?" + parameters.join('&')
        : "rtsp://" + hostname + "/axis-media/media.amp";
    return { uri: uri };
};
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
var RtspSession = /** @class */ (function (_super) {
    __extends(RtspSession, _super);
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
    function RtspSession(config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        var _a = merge(defaultConfig(config.hostname, config.parameters), config), uri = _a.uri, headers = _a.headers, defaultHeaders = _a.defaultHeaders;
        var incoming = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === MessageType.RTSP) {
                    _this._onRtsp(msg);
                    callback(); // Consumes the RTSP packages
                }
                else if (msg.type === MessageType.RTCP) {
                    _this._onRtcp(msg);
                    callback(undefined, msg);
                }
                else if (msg.type === MessageType.RTP) {
                    _this._onRtp(msg);
                    callback(undefined, msg);
                }
                else if (msg.type === MessageType.SDP) {
                    _this._onSdp(msg);
                    // Execute externally registered SDP handler
                    _this.onSdp && _this.onSdp(msg.sdp);
                    // Pass SDP forward
                    callback(undefined, msg);
                }
                else {
                    // Not a message we should handle
                    callback(undefined, msg);
                }
            },
        });
        incoming.on('end', function () {
            // Incoming was ended, assume that outgoing is closed as well
            _this._outgoingClosed = true;
        });
        _this = _super.call(this, incoming) || this;
        _this._outgoingClosed = false;
        _this._reset();
        _this.update(uri, headers, defaultHeaders);
        return _this;
    }
    /**
     * Update the cached RTSP uri and headers.
     * @param  {String} uri                 The RTSP URI.
     * @param  {Object} headers             Maps commands to headers.
     * @param  {Object} [defaultHeaders={}] Default headers.
     * @return {[type]}                     [description]
     */
    RtspSession.prototype.update = function (uri, headers, defaultHeaders) {
        var _a;
        if (headers === void 0) { headers = {}; }
        if (defaultHeaders === void 0) { defaultHeaders = {}; }
        if (uri === undefined) {
            throw new Error('You must supply an uri when creating a RtspSessionComponent');
        }
        this.uri = uri;
        this.defaultHeaders = defaultHeaders;
        this.headers = Object.assign((_a = {},
            _a[RTSP_METHOD.OPTIONS] = {},
            _a[RTSP_METHOD.PLAY] = {},
            _a[RTSP_METHOD.SETUP] = { Blocksize: '64000' },
            _a[RTSP_METHOD.DESCRIBE] = { Accept: 'application/sdp' },
            _a[RTSP_METHOD.PAUSE] = {},
            _a), headers);
    };
    /**
     * Restore the initial values to the state they were in before any RTSP
     * connection was made.
     */
    RtspSession.prototype._reset = function () {
        this._sequence = 1;
        this._retry = function () { return console.error("No request sent, can't retry"); };
        this._callStack = [];
        this._callHistory = [];
        this._state = STATE.IDLE;
        this._waiting = false;
        this._contentBase = null;
        this._sessionId = null;
        if (this._renewSessionInterval !== null) {
            clearInterval(this._renewSessionInterval);
        }
        this._renewSessionInterval = null;
        this.t0 = undefined;
        this.n0 = undefined;
        this.clockrates = undefined;
    };
    /**
     * Handles incoming RTSP messages and send the next command in the queue.
     * @param  {Object} msg An incoming RTSP message.
     * @return {undefined}
     */
    RtspSession.prototype._onRtsp = function (msg) {
        var _this = this;
        this._waiting = false;
        var status = statusCode(msg.data);
        var ended = connectionEnded(msg.data);
        var seq = sequence(msg.data);
        if (seq === null) {
            throw new Error('rtsp: expected sequence number');
        }
        if (this._callHistory === undefined) {
            throw new Error('rtsp: internal error');
        }
        var method = this._callHistory[seq - 1];
        debug('msl:rtsp:incoming')("" + msg.data);
        if (!this._sessionId && !ended) {
            // Response on first SETUP
            this._sessionId = sessionId(msg.data);
            var _sessionTimeout = sessionTimeout(msg.data);
            if (_sessionTimeout !== null) {
                // The server specified that sessions will timeout if not renewed.
                // In order to keep it alive we need periodically send a RTSP_OPTIONS message
                if (this._renewSessionInterval !== null) {
                    clearInterval(this._renewSessionInterval);
                }
                this._renewSessionInterval = setInterval(function () {
                    _this._enqueue({ method: RTSP_METHOD.OPTIONS });
                    _this._dequeue();
                }, Math.max(MIN_SESSION_TIMEOUT, _sessionTimeout - 5) * 1000);
            }
        }
        if (!this._contentBase) {
            this._contentBase = contentBase(msg.data);
        }
        if (status >= 400) {
            // TODO: Retry in certain cases?
            this.onError && this.onError(new Error(msg.data.toString('ascii')));
        }
        if (method === RTSP_METHOD.PLAY) {
            // When starting to play, send the actual range to an external handler.
            this.onPlay && this.onPlay(range(msg.data));
        }
        if (ended) {
            debug('msl:rtsp:incoming')("RTSP Session " + this._sessionId + " ended with statusCode: " + status);
            this._sessionId = null;
        }
        this._dequeue();
    };
    RtspSession.prototype._onRtcp = function (msg) {
        if (this.t0 === undefined || this.n0 === undefined) {
            throw new Error('rtsp: internal error');
        }
        if (packetType(msg.data) === SR.packetType) {
            var rtpChannel = msg.channel - 1;
            this.t0[rtpChannel] = SR.rtpTimestamp(msg.data);
            this.n0[rtpChannel] = getTime(SR.ntpMost(msg.data), SR.ntpLeast(msg.data));
        }
    };
    RtspSession.prototype._onRtp = function (msg) {
        if (this.t0 === undefined ||
            this.n0 === undefined ||
            this.clockrates === undefined) {
            throw new Error('rtsp: internal error');
        }
        var rtpChannel = msg.channel;
        var t0 = this.t0[rtpChannel];
        var n0 = this.n0[rtpChannel];
        if (typeof t0 !== 'undefined' && typeof n0 !== 'undefined') {
            var clockrate = this.clockrates[rtpChannel];
            var t = timestamp(msg.data);
            // The RTP timestamps are unsigned 32 bit and will overflow
            // at some point. We can guard against the overflow by ORing with 0,
            // which will bring any difference back into signed 32-bit domain.
            var dt = (t - t0) | 0;
            msg.ntpTimestamp = (dt / clockrate) * 1000 + n0;
        }
    };
    /**
     * Handles incoming SDP messages, reply with SETUP and optionally PLAY.
     * @param  {Object} msg An incoming SDP message.
     * @return {undefined}
     */
    RtspSession.prototype._onSdp = function (msg) {
        var _this = this;
        this.n0 = {};
        this.t0 = {};
        this.clockrates = {};
        msg.sdp.media.forEach(function (media, index) {
            var uri = media.control;
            // We should actually be able to handle
            // non-dynamic payload types, but ignored for now.
            if (media.rtpmap === undefined) {
                return;
            }
            var clockrate = media.rtpmap.clockrate;
            var rtp = index * 2;
            var rtcp = rtp + 1;
            // TODO: investigate if we can make sure this is defined
            if (uri === undefined) {
                return;
            }
            if (!isAbsolute(uri)) {
                uri = _this._contentBase + uri;
            }
            _this._enqueue({
                method: RTSP_METHOD.SETUP,
                headers: {
                    Transport: 'RTP/AVP/TCP;unicast;interleaved=' + rtp + '-' + rtcp,
                },
                uri: uri,
            });
            // TODO: see if we can get rid of this check somehow
            if (_this.clockrates === undefined) {
                return;
            }
            _this.clockrates[rtp] = clockrate;
        });
        if (this._state === STATE.PLAYING) {
            this._enqueue({
                method: RTSP_METHOD.PLAY,
                headers: {
                    Range: "npt=" + (this.startTime || 0) + "-",
                },
            });
        }
        this._dequeue();
    };
    /**
     * Set up command queue in order to start playing, i.e. PLAY optionally
     * preceeded by OPTIONS/DESCRIBE commands. If not waiting, immediately
     * start sending.
     * @param  {Number} startTime Time (seconds) at which to start playing
     * @return {undefined}
     */
    RtspSession.prototype.play = function (startTime) {
        if (startTime === void 0) { startTime = 0; }
        if (this._state === STATE.IDLE) {
            this.startTime = Number(startTime) || 0;
            this._enqueue({ method: RTSP_METHOD.OPTIONS });
            this._enqueue({ method: RTSP_METHOD.DESCRIBE });
        }
        else if (this._state === STATE.PAUSED) {
            if (this._sessionId === null || this._sessionId === undefined) {
                throw new Error('rtsp: internal error');
            }
            this._enqueue({
                method: RTSP_METHOD.PLAY,
                headers: {
                    Session: this._sessionId,
                },
            });
        }
        this._state = STATE.PLAYING;
        this._dequeue();
    };
    /**
     * Queue a pause command, and send if not waiting.
     * @return {undefined}
     */
    RtspSession.prototype.pause = function () {
        this._enqueue({ method: RTSP_METHOD.PAUSE });
        this._state = STATE.PAUSED;
        this._dequeue();
    };
    /**
     * End the session if there is one, otherwise just cancel
     * any outstanding calls on the stack.
     * @return {undefined}
     */
    RtspSession.prototype.stop = function () {
        if (this._sessionId) {
            this._enqueue({ method: RTSP_METHOD.TEARDOWN });
        }
        else {
            this._callStack = [];
        }
        this._state = STATE.IDLE;
        if (this._renewSessionInterval !== null) {
            clearInterval(this._renewSessionInterval);
            this._renewSessionInterval = null;
        }
        this._dequeue();
    };
    /**
     * Pushes an RTSP request onto the outgoing stream.
     * @param  {Object} options The details about the command to send.
     * @return {undefined}
     */
    RtspSession.prototype.send = function (cmd) {
        var method = cmd.method, headers = cmd.headers, uri = cmd.uri;
        if (method === undefined) {
            throw new Error('missing method when send request');
        }
        this._waiting = true;
        this._retry = this.send.bind(this, cmd);
        if (this._sequence === undefined ||
            this.headers === undefined ||
            this._callHistory === undefined) {
            throw new Error('rtsp: internal error');
        }
        var message = Object.assign({
            type: MessageType.RTSP,
            uri: uri || this.uri,
            data: Buffer.alloc(0),
        }, { method: method, headers: headers }, {
            headers: Object.assign({ CSeq: this._sequence++ }, this.defaultHeaders, // default headers (for all methods)
            this.headers[method], // preset headers for this method
            headers),
        });
        this._sessionId && (message.headers.Session = this._sessionId);
        this._callHistory.push(method);
        if (!this._outgoingClosed) {
            this.outgoing.push(message);
        }
        else {
            // If the socket is closed, dont attempt to send any data
            debug('msl:rtsp:outgoing')("Unable to send " + method + ", connection closed");
        }
    };
    /**
     * Push one or more commands onto the call stack.
     * @param  {...Object} commands One or more commands.
     * @return {undefined}
     */
    RtspSession.prototype._enqueue = function (cmd) {
        if (this._callStack === undefined) {
            throw new Error('rtsp: internal error');
        }
        this._callStack.push(cmd);
    };
    /**
     * If possible, send the next command on the call stack.
     * @return {undefined}
     */
    RtspSession.prototype._dequeue = function () {
        if (this._callStack === undefined) {
            throw new Error('rtsp: internal error');
        }
        if (!this._waiting && this._callStack.length > 0) {
            var cmd = this._callStack.shift();
            if (cmd !== undefined) {
                this.send(cmd);
            }
        }
    };
    return RtspSession;
}(Tube));
export { RtspSession };
//# sourceMappingURL=index.js.map