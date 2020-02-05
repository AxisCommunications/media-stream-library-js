import debug from 'debug';
import { Tube } from '../component';
import { Transform } from 'stream';
import { MessageType } from '../message';
const MAX_CAPTURE_BYTES = 225000000; // 5 min at a rate of 6 Mbit/s
/**
 * Component that records MP4 data.
 *
 * @extends Component
 */
export class Mp4Capture extends Tube {
    /**
     * Create a new mp4muxer component.
     * @return {undefined}
     */
    constructor(maxSize = MAX_CAPTURE_BYTES) {
        const incoming = new Transform({
            objectMode: true,
            transform: (msg, encoding, callback) => {
                if (msg.type === MessageType.SDP) {
                    // Arrival of SDP indicates new movie, start recording if active.
                    if (this._active) {
                        this._capture = true;
                    }
                }
                else if (this._capture && msg.type === MessageType.ISOM) {
                    // MP4 box has arrived, record if appropriate
                    if (this._bufferOffset <
                        this._buffer.byteLength - msg.data.byteLength) {
                        msg.data.copy(this._buffer, this._bufferOffset);
                        this._bufferOffset += msg.data.byteLength;
                    }
                    else {
                        this.stop();
                    }
                }
                // Always pass on all messages
                callback(undefined, msg);
            },
        });
        // Stop any recording when the stream is closed.
        incoming.on('finish', () => {
            this.stop();
        });
        super(incoming);
        this._buffer = Buffer.allocUnsafe(0);
        this._bufferSize = maxSize;
        this._bufferOffset = 0;
        this._active = false;
        this._capture = false;
        this._captureCallback = () => {
            /** noop */
        };
    }
    /**
     * Activate video capture. The capture will begin when a new movie starts,
     * and will terminate when the movie ends or when the buffer is full. On
     * termination, the callback you passed will be called with the captured
     * data as argument.
     * @public
     * @param  {Function} callback Will be called when data is captured.
     * @return {undefined}
     */
    start(callback) {
        if (!this._active) {
            debug('msl:capture:start')(callback);
            this._captureCallback = callback;
            this._buffer = Buffer.allocUnsafe(this._bufferSize);
            this._bufferOffset = 0;
            this._active = true;
        }
    }
    /**
     * Deactivate video capture. This ends an ongoing capture and prevents
     * any further capturing.
     * @public
     * @return {undefined}
     */
    stop() {
        if (this._active) {
            debug('msl:capture:stop')(`captured bytes: ${this._bufferOffset}`);
            try {
                this._captureCallback(this._buffer.slice(0, this._bufferOffset));
            }
            catch (e) {
                console.error(e);
            }
            this._buffer = Buffer.allocUnsafe(0);
            this._bufferOffset = 0;
            this._active = false;
            this._capture = false;
        }
    }
}
//# sourceMappingURL=index.js.map