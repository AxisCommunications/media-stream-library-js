import { Transform } from 'stream';
export const createTransform = (transform) => {
    return new Transform({
        objectMode: true,
        transform,
    });
};
//# sourceMappingURL=messageStreams.js.map