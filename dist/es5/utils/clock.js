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
var Clock = /** @class */ (function () {
    function Clock() {
        this.elapsed = 0;
        this.started = 0;
        this.stopped = true;
    }
    Clock.prototype.start = function () {
        if (this.stopped) {
            this.started = window.performance.now();
            this.stopped = false;
        }
    };
    Clock.prototype.stop = function () {
        if (!this.stopped) {
            this.elapsed = this.now();
            this.stopped = true;
        }
    };
    Clock.prototype.reset = function () {
        this.elapsed = 0;
        this.started = 0;
        this.stopped = true;
    };
    // Gives the elapsed time in milliseconds since the
    // clock was first started (after last reset).
    Clock.prototype.now = function () {
        if (this.stopped) {
            return this.elapsed;
        }
        else {
            return this.elapsed + (window.performance.now() - this.started);
        }
    };
    Clock.prototype.play = function () {
        this.start();
    };
    Clock.prototype.pause = function () {
        this.stop();
    };
    Object.defineProperty(Clock.prototype, "currentTime", {
        // Gives the elapsed time in seconds since last reset.
        get: function () {
            return this.now() / 1000;
        },
        enumerable: true,
        configurable: true
    });
    return Clock;
}());
export { Clock };
//# sourceMappingURL=clock.js.map