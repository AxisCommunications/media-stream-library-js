"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("../component");
const stream_1 = require("stream");
const net_1 = require("net");
const url_1 = require("url");
const message_1 = require("../message");
class TcpSource extends component_1.Source {
    /**
     * Create a TCP component.
     * A TCP socket will be created from parsing the URL of the first outgoing message.
     */
    constructor() {
        let socket;
        /**
         * Set up an incoming stream and attach it to the socket.
         * @type {Readable}
         */
        const incoming = new stream_1.Readable({
            objectMode: true,
            read: function () {
                //
            },
        });
        /**
         * Set up outgoing stream and attach it to the socket.
         * @type {Writable}
         */
        const outgoing = new stream_1.Writable({
            objectMode: true,
            write: function (msg, encoding, callback) {
                const b = msg.data;
                if (!socket) {
                    // Create socket on first outgoing message
                    /*
                    `OPTIONS rtsp://192.168.0.3:554/axis-media/media.amp?resolution=176x144&fps=1 RTSP/1.0
                    CSeq: 1
                    Date: Wed, 03 Jun 2015 14:26:16 GMT
                    `
                    */
                    const firstSpace = b.indexOf(' ');
                    const secondSpace = b.indexOf(' ', firstSpace + 1);
                    const url = b.slice(firstSpace, secondSpace).toString('ascii');
                    const { hostname, port } = url_1.parse(url);
                    socket = net_1.connect(Number(port) || 554, hostname === null ? undefined : hostname);
                    socket.on('error', e => {
                        console.error('TCP socket error:', e);
                        socket.destroy();
                        incoming.push(null);
                    });
                    socket.setTimeout(2000, () => {
                        console.error(`Timeout when connecting to ${hostname}:${port}`);
                        socket.destroy();
                        incoming.push(null);
                    });
                    socket.on('data', buffer => {
                        if (!incoming.push({ data: buffer, type: message_1.MessageType.RAW })) {
                            console.warn('TCP Component internal error: not allowed to push more data');
                        }
                    });
                    // When closing a socket, indicate there is no more data to be sent,
                    // but leave the outgoing stream open to check if more requests are coming.
                    socket.on('finish', e => {
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
        incoming.on('error', e => {
            console.log('closing TCP socket due to incoming error', e);
            socket && socket.end();
        });
        // When there is no more data going to be sent, close!
        incoming.on('finish', () => {
            socket && socket.end();
        });
        // When an error happens on the outgoing stream, just warn.
        outgoing.on('error', e => {
            console.warn('error during TCP send, ignoring:', e);
        });
        // When there is no more data going to be written, close!
        outgoing.on('finish', () => {
            socket && socket.end();
        });
        /**
         * initialize the component.
         */
        super(incoming, outgoing);
    }
}
exports.TcpSource = TcpSource;
//# sourceMappingURL=index.js.map