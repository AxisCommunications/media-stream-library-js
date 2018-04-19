/**
 * A scheduler that can decide when to execute a certain
 * timestamped callback so that it happens in sync with a video
 * element.
 *
 * To use it, initialize a new Scheduler with a video element
 * (to synchronize against) and a callback (to be called when
 * a message is in sync with the video).
 * Call the `run` method every time a new message arrives that
 * you want to schedule (it needs to have an ntpTimestamp).
 * As soon at the presentation time is known, call the `init`
 * method and pass in that time, so that the scheduler can
 * start to schedule the callbacks. From then on, whenever
 * a message in the queue has a timestamp that matches the
 * current presentation time of the video, your callback will
 * fire.
 *
 * @class Scheduler
 */

class Scheduler {
  constructor (videoEl, handler, tolerance = 10) {
    this._videoEl = videoEl
    this._handler = handler
    this._tolerance = tolerance

    this._nextRun = null
    this._fifo = []
    this._ntpPresentationTime = undefined
  }

  reset () {
    clearTimeout(this._nextRun)
    this._fifo = []
    this._ntpPresentationTime = undefined
  }

  init (ntpPresentationTime) {
    this._ntpPresentationTime = ntpPresentationTime
    this.run()
  }

  run (msg) {
    clearTimeout(this._nextRun)
    // If there is a new message, add it to the FIFO queue
    if (typeof msg !== 'undefined') {
      this._fifo.push(msg)
    }
    // If there is no way to schedule anything, just return.
    // The first schedule will happen anyway when the
    // presentation time offset is initialized
    if (typeof this._ntpPresentationTime === 'undefined') {
      return
    }
    // If there are no messages, we don't need to bother or
    // even re-schedule, because the new call to .run() will
    // have to come from outside with a new msg.
    if (this._fifo.length === 0) {
      return
    }
    // There is at least one message in the FIFO queue, either
    // display it, or re-schedule the method for later execution
    let timeToPresent
    do {
      msg = this._fifo.shift()
      const ntpTimestamp = msg.ntpTimestamp
      if (!ntpTimestamp) {
        continue
      }
      const presentationTime = ntpTimestamp - this._ntpPresentationTime
      timeToPresent = presentationTime - this._videoEl.currentTime * 1000
      // If the message is within a tolerance of the presentation time
      // then call the handler.
      if (timeToPresent > -this._tolerance && timeToPresent < this._tolerance) {
        this._handler && this._handler(msg)
      }
    } while (timeToPresent < this._tolerance && this._fifo.length > 0)

    if (timeToPresent < -this._tolerance) {
      // we ran out of messages, delay the video with the same amount
      // of delay as the last message had on the FIFO queue.
      // Scheduler will re-run on the next message from outside, so
      // we don't need to re-schedule a new run here.
      this._videoEl.pause()
      setTimeout(() => this._videoEl.play(), -timeToPresent)
    } else if (timeToPresent > this._tolerance) {
      // message is later than video, add it back to the queue and
      // re-run the scheduling at a later point in time
      this._fifo.unshift(msg)
      this._nextRun = setTimeout(() => this.run(), timeToPresent)
    }
  }
}

module.exports = Scheduler
