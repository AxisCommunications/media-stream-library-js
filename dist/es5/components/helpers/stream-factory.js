import { Readable, Transform, Writable } from 'stream';
var StreamFactory = /** @class */ (function () {
    function StreamFactory() {
    }
    /**
     * Creates a writable stream that sends all messages written to the stream
     * to a callback function and then considers it written.
     * @param {Function} fn  The callback to be invoked on the message
     */
    StreamFactory.consumer = function (fn) {
        if (fn === void 0) { fn = function () {
            /* */
        }; }
        return new Writable({
            objectMode: true,
            write: function (msg, encoding, callback) {
                fn(msg);
                callback();
            },
        });
    };
    StreamFactory.peeker = function (fn) {
        if (typeof fn !== 'function') {
            throw new Error('you must supply a function');
        }
        return new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                fn(msg);
                callback(undefined, msg);
            },
        });
    };
    /**
     * Creates a readable stream that sends a message for each element of an array.
     * @param {Array} arr  The array with elements to be turned into a stream.
     */
    StreamFactory.producer = function (messages) {
        var counter = 0;
        return new Readable({
            objectMode: true,
            read: function () {
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
    };
    StreamFactory.recorder = function (type, fileStream) {
        return new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                var timestamp = Date.now();
                // Replace binary data with base64 string
                var message = Object.assign({}, msg, {
                    data: msg.data.toString('base64'),
                });
                fileStream.write(JSON.stringify({ type: type, timestamp: timestamp, message: message }, null, 2));
                fileStream.write(',\n');
                callback(undefined, msg);
            },
        });
    };
    /**
     * Yield binary messages from JSON packet array until depleted.
     * @return {Generator} Returns a JSON packet iterator.
     */
    StreamFactory.replayer = function (packets) {
        var packetCounter = 0;
        var lastTimestamp = packets[0].timestamp;
        return new Readable({
            objectMode: true,
            read: function () {
                var packet = packets[packetCounter++];
                if (packet) {
                    var type = packet.type, timestamp = packet.timestamp, message = packet.message;
                    var delay = timestamp - lastTimestamp;
                    lastTimestamp = timestamp;
                    if (message) {
                        var data = message.data
                            ? Buffer.from(message.data, 'base64')
                            : Buffer.alloc(0);
                        var msg = Object.assign({}, message, { data: data });
                        this.push({ type: type, delay: delay, msg: msg });
                    }
                    else {
                        this.push({ type: type, delay: delay, msg: null });
                    }
                }
                else {
                    this.push(null);
                }
            },
        });
    };
    return StreamFactory;
}());
export default StreamFactory;
//# sourceMappingURL=stream-factory.js.map