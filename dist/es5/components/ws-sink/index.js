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
import { Sink } from '../component';
import { Readable, Writable } from 'stream';
import { MessageType } from '../message';
/**
 * The socket used here is a ws socket returned by
 * a ws Server's 'connection' event.
 */
var WSSink = /** @class */ (function (_super) {
    __extends(WSSink, _super);
    function WSSink(socket) {
        var _this = this;
        var outgoing = new Readable({
            objectMode: true,
            read: function () {
                /** noop */
            },
        });
        var incoming = new Writable({
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
        socket.on('message', function (data) {
            outgoing.push({ data: data, type: MessageType.RAW });
        });
        socket.on('close', function () {
            outgoing.push(null);
        });
        socket.on('error', function (e) {
            console.error('WebSocket error:', e);
            socket.terminate();
            outgoing.push(null);
        });
        // When an error is sent on the incoming stream, close the socket.
        incoming.on('error', function (e) {
            console.log('closing WebSocket due to incoming error', e);
            socket && socket.close && socket.close();
        });
        // When there is no more data going to be sent, close!
        incoming.on('finish', function () {
            socket && socket.close && socket.close();
        });
        // When an error happens on the outgoing stream, just warn.
        outgoing.on('error', function (e) {
            console.warn('error during WebSocket send, ignoring:', e);
        });
        // When there is no more data going to be written, close!
        outgoing.on('finish', function () {
            socket && socket.close && socket.close();
        });
        /**
         * initialize the component.
         */
        _this = _super.call(this, incoming, outgoing) || this;
        return _this;
    }
    return WSSink;
}(Sink));
export { WSSink };
//# sourceMappingURL=index.js.map