var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import debug from 'debug';
import { Tube } from '../component';
import { Transform } from 'stream';
import { MessageType } from '../message';
var MAX_CAPTURE_BYTES = 225000000; // 5 min at a rate of 6 Mbit/s
/**
 * Component that records MP4 data.
 *
 * @extends Component
 */
var Mp4Capture = /** @class */ (function (_super) {
    __extends(Mp4Capture, _super);
    /**
     * Create a new mp4muxer component.
     * @return {undefined}
     */
    function Mp4Capture(maxSize) {
        if (maxSize === void 0) { maxSize = MAX_CAPTURE_BYTES; }
        var _this = this;
        var incoming = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === MessageType.SDP) {
                    // Arrival of SDP indicates new movie, start recording if active.
                    if (_this._active) {
                        _this._capture = true;
                    }
                }
                else if (_this._capture && msg.type === MessageType.ISOM) {
                    // MP4 box has arrived, record if appropriate
                    if (_this._bufferOffset <
                        _this._buffer.byteLength - msg.data.byteLength) {
                        msg.data.copy(_this._buffer, _this._bufferOffset);
                        _this._bufferOffset += msg.data.byteLength;
                    }
                    else {
                        _this.stop();
                    }
                }
                // Always pass on all messages
                callback(undefined, msg);
            },
        });
        // Stop any recording when the stream is closed.
        incoming.on('finish', function () {
            _this.stop();
        });
        _this = _super.call(this, incoming) || this;
        _this._buffer = Buffer.allocUnsafe(0);
        _this._bufferSize = maxSize;
        _this._bufferOffset = 0;
        _this._active = false;
        _this._capture = false;
        _this._captureCallback = function () {
            /** noop */
        };
        return _this;
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
    Mp4Capture.prototype.start = function (callback) {
        if (!this._active) {
            debug('msl:capture:start')(callback);
            this._captureCallback = callback;
            this._buffer = Buffer.allocUnsafe(this._bufferSize);
            this._bufferOffset = 0;
            this._active = true;
        }
    };
    /**
     * Deactivate video capture. This ends an ongoing capture and prevents
     * any further capturing.
     * @public
     * @return {undefined}
     */
    Mp4Capture.prototype.stop = function () {
        if (this._active) {
            debug('msl:capture:stop')("captured bytes: " + this._bufferOffset);
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
    };
    return Mp4Capture;
}(Tube));
export { Mp4Capture };
//# sourceMappingURL=index.js.map