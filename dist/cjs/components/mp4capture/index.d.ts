/// <reference types="node" />
import { Tube } from '../component';
/**
 * Component that records MP4 data.
 *
 * @extends Component
 */
export declare class Mp4Capture extends Tube {
    private _active;
    private _capture;
    private _captureCallback;
    private _bufferOffset;
    private _bufferSize;
    private _buffer;
    /**
     * Create a new mp4muxer component.
     * @return {undefined}
     */
    constructor(maxSize?: number);
    /**
     * Activate video capture. The capture will begin when a new movie starts,
     * and will terminate when the movie ends or when the buffer is full. On
     * termination, the callback you passed will be called with the captured
     * data as argument.
     * @public
     * @param  {Function} callback Will be called when data is captured.
     * @return {undefined}
     */
    start(callback: (buffer: Buffer) => void): void;
    /**
     * Deactivate video capture. This ends an ongoing capture and prevents
     * any further capturing.
     * @public
     * @return {undefined}
     */
    stop(): void;
}
