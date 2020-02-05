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
import { Source } from '../component';
import { Readable, Writable } from 'stream';
import { MessageType } from '../message';
import { openWebSocket } from './openwebsocket';
// Named status codes for CloseEvent, see:
// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
var CLOSE_GOING_AWAY = 1001;
var WSSource = /** @class */ (function (_super) {
    __extends(WSSource, _super);
    /**
     * Create a WebSocket component.
     *
     * The constructor sets up two streams and connects them to the socket as
     * soon as the socket is available (and open).
     *
     * @param {Object} socket - an open WebSocket.
     */
    function WSSource(socket) {
        var _this = this;
        if (socket === undefined) {
            throw new Error('socket argument missing');
        }
        /**
         * Set up an incoming stream and attach it to the socket.
         * @type {Readable}
         */
        var incoming = new Readable({
            objectMode: true,
            read: function () {
                //
            },
        });
        socket.onmessage = function (msg) {
            var buffer = Buffer.from(msg.data);
            if (!incoming.push({ data: buffer, type: MessageType.RAW })) {
                // Something happened down stream that it is no longer processing the
                // incoming data, and the stream buffer got full. In this case it is
                // best to just close the socket instead of throwing away data in the
                // hope that the situation will get resolved.
                if (socket.readyState === WebSocket.OPEN) {
                    debug('msl:websocket:incoming')('downstream frozen');
                    socket.close();
                }
            }
        };
        // When an error is sent on the incoming stream, close the socket.
        incoming.on('error', function (e) {
            console.warn('closing socket due to incoming error', e);
            socket.close();
        });
        /**
         * Set up outgoing stream and attach it to the socket.
         * @type {Writable}
         */
        var outgoing = new Writable({
            objectMode: true,
            write: function (msg, encoding, callback) {
                try {
                    socket.send(msg.data);
                }
                catch (e) {
                    console.warn('message lost during send:', msg);
                }
                callback();
            },
        });
        // When an error happens on the outgoing stream, just warn.
        outgoing.on('error', function (e) {
            console.warn('error during websocket send, ignoring:', e);
        });
        // When there is no more data going to be written, close!
        outgoing.on('finish', function () {
            debug('msl:websocket:outgoing')('finish');
            if (socket.readyState !== WebSocket.CLOSED) {
                socket.close();
            }
        });
        /**
         * Handler for when WebSocket is CLOSED
         * @param  {CloseEvent} e The event associated with a close
         * @param  {Number} e.code The status code sent by the server
         *   Possible codes are documented here:
         *   https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
         * @return {undefined}
         */
        socket.onclose = function (e) {
            debug('msl:websocket:close')("" + e.code);
            if (e.code === CLOSE_GOING_AWAY) {
                _this.onServerClose && _this.onServerClose();
            }
            // Terminate the streams.
            incoming.push(null);
            outgoing.end();
        };
        /**
         * initialize the component.
         */
        _this = _super.call(this, incoming, outgoing) || this;
        return _this;
    }
    /**
     * Expose websocket opener as a class method that returns a promise which
     * resolves with a new WebSocketComponent.
     */
    WSSource.open = function (config) {
        return openWebSocket(config).then(function (socket) { return new WSSource(socket); });
    };
    return WSSource;
}(Source));
export { WSSource };
//# sourceMappingURL=index.js.map