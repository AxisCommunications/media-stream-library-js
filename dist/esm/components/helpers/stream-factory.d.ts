/// <reference types="node" />
import { Readable, Transform, Writable } from 'stream';
export default class StreamFactory {
    /**
     * Creates a writable stream that sends all messages written to the stream
     * to a callback function and then considers it written.
     * @param {Function} fn  The callback to be invoked on the message
     */
    static consumer(fn?: (msg: any) => void): Writable;
    static peeker(fn: (msg: any) => void): Transform;
    /**
     * Creates a readable stream that sends a message for each element of an array.
     * @param {Array} arr  The array with elements to be turned into a stream.
     */
    static producer(messages?: any[]): Readable;
    static recorder(type: string, fileStream: NodeJS.WritableStream): Transform;
    /**
     * Yield binary messages from JSON packet array until depleted.
     * @return {Generator} Returns a JSON packet iterator.
     */
    static replayer(packets: any[]): Readable;
}
