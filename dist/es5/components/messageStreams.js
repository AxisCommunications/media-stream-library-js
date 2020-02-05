import { Transform } from 'stream';
export var createTransform = function (transform) {
    return new Transform({
        objectMode: true,
        transform: transform,
    });
};
//# sourceMappingURL=messageStreams.js.map