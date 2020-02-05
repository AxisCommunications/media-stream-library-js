"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
exports.createTransform = (transform) => {
    return new stream_1.Transform({
        objectMode: true,
        transform,
    });
};
//# sourceMappingURL=messageStreams.js.map