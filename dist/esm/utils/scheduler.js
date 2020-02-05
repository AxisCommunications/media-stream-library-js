// The default tolerance for matching the handler
// invocation to clock presentation time.
const DEFAULT_TOLERANCE = 10;
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
export class Scheduler {
    /**
     * Creates an instance of Scheduler.
     * @param {any} clock The clock to use (so we can control playback)
     * @param {any} handler The callback to invoke when a message is in sync
     * @param {number} [tolerance=DEFAULT_TOLERANCE] The milliseconds defining "in sync"
     * @memberof Scheduler
     */
    constructor(clock, handler, tolerance = DEFAULT_TOLERANCE) {
        this._clock = clock;
        this._handler = handler;
        this._tolerance = tolerance;
        this._nextRun = 0;
        this._nextPlay = 0;
        this._fifo = [];
        this._ntpPresentationTime = 0;
        this._suspended = false;
    }
    /**
     * Bring the scheduler back to it's initial state.
     * @memberof Scheduler
     */
    reset() {
        clearTimeout(this._nextRun);
        clearTimeout(this._nextPlay);
        this._fifo = [];
        this._ntpPresentationTime = 0;
        this._suspended = false;
    }
    /**
     * Initialize the scheduler.
     *
     * @param {any} ntpPresentationTime The offset representing the start of the presentation
     * @memberof Scheduler
     */
    init(ntpPresentationTime) {
        this._ntpPresentationTime = ntpPresentationTime;
    }
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
    suspend() {
        clearTimeout(this._nextPlay);
        this._suspended = true;
    }
    /**
     * Resume the scheduler.
     *
     * This gives back control of the clock and the ability
     * to schedule messages. The scheduler will immediately
     * try to do that on resume.
     *
     * @memberof Scheduler
     */
    resume() {
        this._suspended = false;
        this.run(undefined);
    }
    /**
     * Run the scheduler.
     *
     * @param {any} [msg] New message to schedule.
     * @memberof Scheduler
     */
    run(newMessage) {
        clearTimeout(this._nextRun);
        // If there is no way to schedule anything, just return.
        // The first schedule will happen for the first .run that
        // is called after the presentation time has been initialized.
        if (typeof this._ntpPresentationTime === 'undefined') {
            return;
        }
        // If there is a new message, add it to the FIFO queue
        if (typeof newMessage !== 'undefined') {
            this._fifo.push(newMessage);
        }
        // If the scheduler is suspended, we can only keep the
        // messages and not do anything with them.
        if (this._suspended) {
            return;
        }
        // If there are no messages, we don't need to bother or
        // even re-schedule, because the new call to .run() will
        // have to come from outside with a new message.
        if (this._fifo.length === 0) {
            return;
        }
        // There is at least one message in the FIFO queue, either
        // display it, or re-schedule the method for later execution
        let timeToPresent = 0;
        let currentMessage;
        do {
            const msg = this._fifo.shift();
            if (msg === undefined) {
                throw new Error('internal error: message should never be undefined');
            }
            currentMessage = msg;
            const ntpTimestamp = currentMessage.ntpTimestamp;
            if (ntpTimestamp === undefined) {
                continue;
            }
            const presentationTime = ntpTimestamp - this._ntpPresentationTime;
            timeToPresent = presentationTime - this._clock.currentTime * 1000;
            // If the message is within a tolerance of the presentation time
            // then call the handler.
            if (Math.abs(timeToPresent) < this._tolerance) {
                this._handler && this._handler(currentMessage);
            }
        } while (timeToPresent < this._tolerance && this._fifo.length > 0);
        if (timeToPresent < -this._tolerance) {
            // We ran out of messages, delay the video with the same amount
            // of delay as the last message had on the FIFO queue.
            // Since we don't have any messages in the queue right now,
            // the only way for anything to happen is if scheduler.run
            // is called.
            clearTimeout(this._nextPlay);
            this._clock.pause();
            this._nextPlay = window.setTimeout(() => this._clock.play(), -timeToPresent);
        }
        else if (timeToPresent > this._tolerance) {
            // message is later than video, add it back to the queue and
            // re-run the scheduling at a later point in time
            this._fifo.unshift(currentMessage);
            this._nextRun = window.setTimeout(() => this.run(undefined), timeToPresent);
        }
    }
}
//# sourceMappingURL=scheduler.js.map