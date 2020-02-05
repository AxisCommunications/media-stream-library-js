"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("../component");
const stream_factory_1 = __importDefault(require("../helpers/stream-factory"));
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Component that writes passing incoming/outgoing streams
 * interleaved to a filestream. The resulting stream (file) stores
 * messages as a JSON array, where each element has a type, timestamp,
 * and the original message (that went through the stream).
 */
class Recorder extends component_1.Tube {
    /**
     * Create a new recorder component that will record to a writable stream.
     * @param {Stream} fileStream The stream to save the messages to.
     * @return {undefined}
     */
    constructor(fileStream) {
        const incoming = stream_factory_1.default.recorder('incoming', fileStream);
        const outgoing = stream_factory_1.default.recorder('outgoing', fileStream);
        const interleaved = { incoming, outgoing };
        const streamsFinished = [];
        for (const [key, value] of Object.entries(interleaved)) {
            streamsFinished.push(new Promise(resolve => value.on('finish', () => {
                const timestamp = Date.now();
                const message = null;
                const type = key;
                fileStream.write(JSON.stringify({ type, timestamp, message }, null, 2));
                fileStream.write(',\n');
                resolve();
            })));
        }
        // start of file: begin JSON array
        fileStream.write('[\n');
        // end of file: close JSON array
        Promise.all(streamsFinished)
            .then(() => {
            fileStream.write(JSON.stringify(null));
            fileStream.write('\n]\n');
        })
            .catch(() => {
            /** ignore */
        });
        super(incoming, outgoing);
    }
    /**
     * Create a new recorder component that will record to a file.
     * @param {String} filename The name of the file (relative to cwd)
     * @return {RecorderComponent}
     */
    static toFile(filename = 'data.json') {
        const cwd = process.cwd();
        const fileStream = fs_1.createWriteStream(path_1.join(cwd, filename));
        return new Recorder(fileStream);
    }
}
exports.Recorder = Recorder;
//# sourceMappingURL=index.js.map