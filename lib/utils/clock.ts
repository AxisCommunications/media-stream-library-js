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
export class Clock {
  private started: number
  private stopped: boolean
  private elapsed: number

  constructor() {
    this.elapsed = 0
    this.started = 0
    this.stopped = true
  }

  public start() {
    if (this.stopped) {
      this.started = window.performance.now()
      this.stopped = false
    }
  }

  public stop() {
    if (!this.stopped) {
      this.elapsed = this.now()
      this.stopped = true
    }
  }

  public reset() {
    this.elapsed = 0
    this.started = 0
    this.stopped = true
  }

  // Gives the elapsed time in milliseconds since the
  // clock was first started (after last reset).
  public now() {
    if (this.stopped) {
      return this.elapsed
    } else {
      return this.elapsed + (window.performance.now() - this.started)
    }
  }

  public play() {
    this.start()
  }

  public pause() {
    this.stop()
  }

  // Gives the elapsed time in seconds since last reset.
  get currentTime() {
    return this.now() / 1000
  }
}
