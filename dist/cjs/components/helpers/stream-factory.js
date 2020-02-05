"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
class StreamFactory {
    /**
     * Creates a writable stream that sends all messages written to the stream
     * to a callback function and then considers it written.
     * @param {Function} fn  The callback to be invoked on the message
     */
    static consumer(fn = () => {
        /* */
    }) {
        return new stream_1.Writable({
            objectMode: true,
            write(msg, encoding, callback) {
                fn(msg);
                callback();
            },
        });
    }
    static peeker(fn) {
        if (typeof fn !== 'function') {
            throw new Error('you must supply a function');
        }
        return new stream_1.Transform({
            objectMode: true,
            transform(msg, encoding, callback) {
                fn(msg);
                callback(undefined, msg);
            },
        });
    }
    /**
     * Creates a readable stream that sends a message for each element of an array.
     * @param {Array} arr  The array with elements to be turned into a stream.
     */
    static producer(messages) {
        let counter = 0;
        return new stream_1.Readable({
            objectMode: true,
            read() {
                if (messages !== undefined) {
                    if (counter < messages.length) {
                        this.push(messages[counter++]);
                    }
                    else {
                        // End the stream
                        this.push(null);
                    }
                }
            },
        });
    }
    static recorder(type, fileStream) {
        return new stream_1.Transform({
            objectMode: true,
            transform(msg, encoding, callback) {
                const timestamp = Date.now();
                // Replace binary data with base64 string
                const message = Object.assign({}, msg, {
                    data: msg.data.toString('base64'),
                });
                fileStream.write(JSON.stringify({ type, timestamp, message }, null, 2));
                fileStream.write(',\n');
                callback(undefined, msg);
            },
        });
    }
    /**
     * Yield binary messages from JSON packet array until depleted.
     * @return {Generator} Returns a JSON packet iterator.
     */
    static replayer(packets) {
        let packetCounter = 0;
        let lastTimestamp = packets[0].timestamp;
        return new stream_1.Readable({
            objectMode: true,
            read() {
                const packet = packets[packetCounter++];
                if (packet) {
                    const { type, timestamp, message } = packet;
                    const delay = timestamp - lastTimestamp;
                    lastTimestamp = timestamp;
                    if (message) {
                        const data = message.data
                            ? Buffer.from(message.data, 'base64')
                            : Buffer.alloc(0);
                        const msg = Object.assign({}, message, { data });
                        this.push({ type, delay, msg });
                    }
                    else {
                        this.push({ type, delay, msg: null });
                    }
                }
                else {
                    this.push(null);
                }
            },
        });
    }
}
exports.default = StreamFactory;
//# sourceMappingURL=stream-factory.js.map