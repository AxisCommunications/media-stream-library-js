export interface Clock {
    readonly currentTime: number;
    readonly play: () => void;
    readonly pause: () => void;
}
/**
 * A scheduler that can decide when to execute a certain
 * timestamped callback so that it happens in sync with a video
 * element.
 *
 * To use it:
 *
 * (1) Initialize a new Scheduler with a clock (to synchronize
 * against) and a callback (to be called when a message is in
 * sync with the video). The clock can be a HTMLVideoElement,
 * or anything that has a `currentTime` property which gives
 * the current presentation time in seconds, and a `pause` and
 * `play` method to control playback.
 *
 * (2) Call the `run` method every time a new message arrives
 * that you want to schedule (it needs to have an ntpTimestamp).
 * As soon at the presentation time is known, call the `init`
 * method and pass in that time, so that the scheduler can
 * start to schedule the callbacks. From then on, whenever
 * a message in the queue has a timestamp that matches the
 * current presentation time of the video, your callback will
 * fire.
 *
 * @class Scheduler
 */
export declare class Scheduler<T extends {
    readonly ntpTimestamp?: number;
}> {
    private _clock;
    private _handler;
    private _tolerance;
    private _nextRun;
    private _nextPlay;
    private _fifo;
    private _ntpPresentationTime;
    private _suspended;
    /**
     * Creates an instance of Scheduler.
     * @param {any} clock The clock to use (so we can control playback)
     * @param {any} handler The callback to invoke when a message is in sync
     * @param {number} [tolerance=DEFAULT_TOLERANCE] The milliseconds defining "in sync"
     * @memberof Scheduler
     */
    constructor(clock: Clock, handler: (msg: T) => void, tolerance?: number);
    /**
     * Bring the scheduler back to it's initial state.
     * @memberof Scheduler
     */
    reset(): void;
    /**
     * Initialize the scheduler.
     *
     * @param {any} ntpPresentationTime The offset representing the start of the presentation
     * @memberof Scheduler
     */
    init(ntpPresentationTime: number): void;
    /**
     * Suspend the scheduler.
     *
     * This releases control of the clock and stops any scheduling activity.
     * Note that this doesn't mean the clock will be in a particular state
     * (could be started or stopped), just that the scheduler will no longer
     * control it.
     *
     * @memberof Scheduler
     */
    suspend(): void;
    /**
     * Resume the scheduler.
     *
     * This gives back control of the clock and the ability
     * to schedule messages. The scheduler will immediately
     * try to do that on resume.
     *
     * @memberof Scheduler
     */
    resume(): void;
    /**
     * Run the scheduler.
     *
     * @param {any} [msg] New message to schedule.
     * @memberof Scheduler
     */
    run(newMessage?: T): void;
}
