/// <reference types="node" />
import { Readable } from 'stream';
import { Source } from '../component';
export declare class Replayer extends Source {
    /**
     * Create a new replay component that will play provided data.
     * The packets need to conform to the format:
     * {
     *   type: 'incoming'/'outgoing',
     *   delay: Number,
     *   msg: Object (original message)
     * }
     * @param {String} data The JSON data to replay.
     * @return {undefined}
     */
    constructor(packetStream: Readable);
    /**
     * Create a new replay component that will play from a file.
     * @param {String} filename The name of the file (relative to cwd)
     * @return {ReplayComponent}
     */
    static fromFile(filename?: string): Replayer;
}
