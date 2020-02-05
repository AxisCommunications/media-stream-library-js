/**
 * Clock
 *
 * A simple timer to keep track of elapsed time,
 * which can be retrieved with the `now` method.
 * The clock is initially in a stopped state, during
 * which the elapsed time does not increase. When
 * started, the clock will return the total elapsed
 * time since the first start / last reset.
 *
 * As a convenience, start/stop are aliased as
 * play/pause, to mimic a media element (for use
 * as a playback clock). The `currentTime` getter
 * returns the elapsed time in seconds (floating
 * point), also as a convenienve to closely match
 * the behaviour of a video element.
 */
export declare class Clock {
    private started;
    private stopped;
    private elapsed;
    constructor();
    start(): void;
    stop(): void;
    reset(): void;
    now(): number;
    play(): void;
    pause(): void;
    get currentTime(): number;
}
