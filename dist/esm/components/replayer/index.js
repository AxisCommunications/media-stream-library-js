var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Readable, Writable } from 'stream';
import { Source } from '../component';
import { readFileSync } from 'fs';
import { join } from 'path';
import StreamFactory from '../helpers/stream-factory';
import { sleep } from '../helpers/sleep';
export class Replayer extends Source {
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
    constructor(packetStream) {
        let finished = false;
        const incoming = new Readable({
            objectMode: true,
            read: function () {
                //
            },
        });
        /**
         * Emit incoming items in the queue until an outgoing item is found.
         * @param  {Function} callback Call to signal completion.
         * @return {Promise}           undefined
         */
        const start = () => __awaiter(this, void 0, void 0, function* () {
            let packet = packetStream.read();
            while (packet && packet.type === 'incoming') {
                yield sleep(packet.delay);
                incoming.push(packet.msg);
                packet = packetStream.read();
            }
            if (finished) {
                incoming.push(null);
            }
        });
        const outgoing = new Writable({
            objectMode: true,
            write: function (msg, encoding, callback) {
                start().catch(() => {
                    /** ignore */
                }); // resume streaming
                callback();
            },
        });
        outgoing.on('finish', () => {
            finished = true;
        });
        outgoing.on('pipe', () => start());
        super(incoming, outgoing);
    }
    /**
     * Create a new replay component that will play from a file.
     * @param {String} filename The name of the file (relative to cwd)
     * @return {ReplayComponent}
     */
    static fromFile(filename = 'data.json') {
        const cwd = process.cwd();
        const data = readFileSync(join(cwd, filename));
        const packets = JSON.parse(data.toString());
        const packetStream = StreamFactory.replayer(packets);
        return new Replayer(packetStream);
    }
}
//# sourceMappingURL=index.js.map