"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("../component");
const stream_1 = require("stream");
const message_1 = require("../message");
/**
 * The socket used here is a ws socket returned by
 * a ws Server's 'connection' event.
 */
class WSSink extends component_1.Sink {
    constructor(socket) {
        const outgoing = new stream_1.Readable({
            objectMode: true,
            read: () => {
                /** noop */
            },
        });
        const incoming = new stream_1.Writable({
            objectMode: true,
            write: (msg, encoding, callback) => {
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
            outgoing.push({ data, type: message_1.MessageType.RAW });
        });
        socket.on('close', function () {
            outgoing.push(null);
        });
        socket.on('error', (e) => {
            console.error('WebSocket error:', e);
            socket.terminate();
            outgoing.push(null);
        });
        // When an error is sent on the incoming stream, close the socket.
        incoming.on('error', e => {
            console.log('closing WebSocket due to incoming error', e);
            socket && socket.close && socket.close();
        });
        // When there is no more data going to be sent, close!
        incoming.on('finish', () => {
            socket && socket.close && socket.close();
        });
        // When an error happens on the outgoing stream, just warn.
        outgoing.on('error', e => {
            console.warn('error during WebSocket send, ignoring:', e);
        });
        // When there is no more data going to be written, close!
        outgoing.on('finish', () => {
            socket && socket.close && socket.close();
        });
        /**
         * initialize the component.
         */
        super(incoming, outgoing);
    }
}
exports.WSSink = WSSink;
//# sourceMappingURL=index.js.map