import { Sink } from '../component';
export interface MediaTrack {
    type: string;
    encoding?: string;
    mime?: string;
    codec?: any;
}
export declare class MseSink extends Sink {
    private _videoEl;
    private _done?;
    private _lastCheckpointTime;
    onSourceOpen?: (mse: MediaSource, tracks: MediaTrack[]) => void;
    /**
     * Create a Media component.
     *
     * The constructor sets up two streams and connects them to the MediaSource.
     *
     * @param {MediaSource} mse - A media source.
     */
    constructor(el: HTMLVideoElement);
    /**
     * Add a new sourceBuffer to the mediaSource and remove old ones.
     * @param {HTMLMediaElement} el  The media element holding the media source.
     * @param {MediaSource} mse  The media source the buffer should be attached to.
     * @param {String} [mimeType='video/mp4; codecs="avc1.4D0029, mp4a.40.2"'] [description]
     */
    addSourceBuffer(el: HTMLVideoElement, mse: MediaSource, mimeType: string): SourceBuffer;
    get currentTime(): number;
    play(): Promise<void>;
    pause(): void;
}
