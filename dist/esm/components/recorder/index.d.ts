/// <reference types="node" />
import { Tube } from '../component';
/**
 * Component that writes passing incoming/outgoing streams
 * interleaved to a filestream. The resulting stream (file) stores
 * messages as a JSON array, where each element has a type, timestamp,
 * and the original message (that went through the stream).
 */
export declare class Recorder extends Tube {
    /**
     * Create a new recorder component that will record to a writable stream.
     * @param {Stream} fileStream The stream to save the messages to.
     * @return {undefined}
     */
    constructor(fileStream: NodeJS.WritableStream);
    /**
     * Create a new recorder component that will record to a file.
     * @param {String} filename The name of the file (relative to cwd)
     * @return {RecorderComponent}
     */
    static toFile(filename?: string): Recorder;
}
