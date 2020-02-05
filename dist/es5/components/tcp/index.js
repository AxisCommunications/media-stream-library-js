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
import { Source } from '../component';
import { Readable, Writable } from 'stream';
import { connect } from 'net';
import { parse } from 'url';
import { MessageType } from '../message';
var TcpSource = /** @class */ (function (_super) {
    __extends(TcpSource, _super);
    /**
     * Create a TCP component.
     * A TCP socket will be created from parsing the URL of the first outgoing message.
     */
    function TcpSource() {
        var _this = this;
        var socket;
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
        /**
         * Set up outgoing stream and attach it to the socket.
         * @type {Writable}
         */
        var outgoing = new Writable({
            objectMode: true,
            write: function (msg, encoding, callback) {
                var b = msg.data;
                if (!socket) {
                    // Create socket on first outgoing message
                    /*
                    `OPTIONS rtsp://192.168.0.3:554/axis-media/media.amp?resolution=176x144&fps=1 RTSP/1.0
                    CSeq: 1
                    Date: Wed, 03 Jun 2015 14:26:16 GMT
                    `
                    */
                    var firstSpace = b.indexOf(' ');
                    var secondSpace = b.indexOf(' ', firstSpace + 1);
                    var url = b.slice(firstSpace, secondSpace).toString('ascii');
                    var _a = parse(url), hostname_1 = _a.hostname, port_1 = _a.port;
                    socket = connect(Number(port_1) || 554, hostname_1 === null ? undefined : hostname_1);
                    socket.on('error', function (e) {
                        console.error('TCP socket error:', e);
                        socket.destroy();
                        incoming.push(null);
                    });
                    socket.setTimeout(2000, function () {
                        console.error("Timeout when connecting to " + hostname_1 + ":" + port_1);
                        socket.destroy();
                        incoming.push(null);
                    });
                    socket.on('data', function (buffer) {
                        if (!incoming.push({ data: buffer, type: MessageType.RAW })) {
                            console.warn('TCP Component internal error: not allowed to push more data');
                        }
                    });
                    // When closing a socket, indicate there is no more data to be sent,
                    // but leave the outgoing stream open to check if more requests are coming.
                    socket.on('finish', function (e) {
                        console.warn('socket finished', e);
                        incoming.push(null);
                    });
                }
                try {
                    socket.write(msg.data, encoding, callback);
                }
                catch (e) {
                    console.warn('message lost during send:', msg);
                }
            },
        });
        // When an error is sent on the incoming stream, close the socket.
        incoming.on('error', function (e) {
            console.log('closing TCP socket due to incoming error', e);
            socket && socket.end();
        });
        // When there is no more data going to be sent, close!
        incoming.on('finish', function () {
            socket && socket.end();
        });
        // When an error happens on the outgoing stream, just warn.
        outgoing.on('error', function (e) {
            console.warn('error during TCP send, ignoring:', e);
        });
        // When there is no more data going to be written, close!
        outgoing.on('finish', function () {
            socket && socket.end();
        });
        /**
         * initialize the component.
         */
        _this = _super.call(this, incoming, outgoing) || this;
        return _this;
    }
    return TcpSource;
}(Source));
export { TcpSource };
//# sourceMappingURL=index.js.map