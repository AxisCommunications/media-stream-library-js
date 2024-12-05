export interface Clock {
  readonly currentTime: number
  readonly play: () => void
  readonly pause: () => void
}

// The default tolerance for matching the handler
// invocation to clock presentation time.
const DEFAULT_TOLERANCE = 10

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
 */

export class Scheduler<T extends { readonly ntpTimestamp?: number }> {
  private readonly clock: Clock
  private readonly handler: (msg: T) => void
  private readonly tolerance: number
  private nextRun?: ReturnType<typeof setTimeout>
  private nextPlay?: ReturnType<typeof setTimeout>
  private fifo: T[]
  private ntpPresentationTime: number
  private suspended: boolean

  /**
   * Creates an instance of Scheduler.
   * @param clock - The clock to use (so we can control playback)
   * @param handler - The callback to invoke when a message is in sync
   * @param tolerance - The milliseconds defining "in sync" (default = 10)
   */
  constructor(
    clock: Clock,
    handler: (msg: T) => void,
    tolerance = DEFAULT_TOLERANCE
  ) {
    this.clock = clock
    this.handler = handler
    this.tolerance = tolerance
    this.fifo = []
    this.ntpPresentationTime = 0
    this.suspended = false
  }

  /**
   * Bring the scheduler back to it's initial state.
   */
  public reset() {
    clearTimeout(this.nextRun)
    clearTimeout(this.nextPlay)
    this.fifo = []
    this.ntpPresentationTime = 0
    this.suspended = false
  }

  /**
   * Initialize the scheduler.
   *
   * @param ntpPresentationTime - The offset representing the start of the presentation
   */
  public init(ntpPresentationTime: number) {
    this.ntpPresentationTime = ntpPresentationTime
  }

  /**
   * Suspend the scheduler.
   *
   * This releases control of the clock and stops any scheduling activity.
   * Note that this doesn't mean the clock will be in a particular state
   * (could be started or stopped), just that the scheduler will no longer
   * control it.
   */
  public suspend() {
    clearTimeout(this.nextPlay)
    this.suspended = true
  }

  /**
   * Resume the scheduler.
   *
   * This gives back control of the clock and the ability
   * to schedule messages. The scheduler will immediately
   * try to do that on resume.
   */
  public resume() {
    this.suspended = false
    this.run(undefined)
  }

  /**
   * Run the scheduler.
   *
   * @param newMessage - New message to schedule.
   */
  public run(newMessage?: T) {
    clearTimeout(this.nextRun)
    // If there is no way to schedule anything, just return.
    // The first schedule will happen for the first .run that
    // is called after the presentation time has been initialized.
    if (typeof this.ntpPresentationTime === 'undefined') {
      return
    }
    // If there is a new message, add it to the FIFO queue
    if (typeof newMessage !== 'undefined') {
      this.fifo.push(newMessage)
    }
    // If the scheduler is suspended, we can only keep the
    // messages and not do anything with them.
    if (this.suspended) {
      return
    }
    // If there are no messages, we don't need to bother or
    // even re-schedule, because the new call to .run() will
    // have to come from outside with a new message.
    if (this.fifo.length === 0) {
      return
    }
    // There is at least one message in the FIFO queue, either
    // display it, or re-schedule the method for later execution
    let timeToPresent = 0
    let currentMessage: T
    do {
      const msg = this.fifo.shift()
      if (msg === undefined) {
        throw new Error('internal error: message should never be undefined')
      }
      currentMessage = msg
      const ntpTimestamp = currentMessage.ntpTimestamp
      if (ntpTimestamp === undefined) {
        continue
      }
      const presentationTime = ntpTimestamp - this.ntpPresentationTime
      timeToPresent = presentationTime - this.clock.currentTime * 1000
      // If the message is within a tolerance of the presentation time
      // then call the handler.
      if (Math.abs(timeToPresent) < this.tolerance) {
        this.handler && this.handler(currentMessage)
      }
    } while (timeToPresent < this.tolerance && this.fifo.length > 0)

    if (timeToPresent < -this.tolerance) {
      // We ran out of messages, delay the video with the same amount
      // of delay as the last message had on the FIFO queue.
      // Since we don't have any messages in the queue right now,
      // the only way for anything to happen is if scheduler.run
      // is called.
      clearTimeout(this.nextPlay)
      this.clock.pause()
      this.nextPlay = setTimeout(() => this.clock.play(), -timeToPresent)
    } else if (timeToPresent > this.tolerance) {
      // message is later than video, add it back to the queue and
      // re-run the scheduling at a later point in time
      this.fifo.unshift(currentMessage)
      this.nextRun = setTimeout(() => this.run(undefined), timeToPresent)
    }
  }
}
