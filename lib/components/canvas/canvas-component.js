const {Readable, Writable} = require('stream')

const Component = require('../component')
const {SDP, JPEG} = require('../messageTypes')
const Clock = require('../../utils/clock')
const Scheduler = require('../../utils/scheduler')

/**
 * Canvas component
 *
 * Draws an incoming stream of JPEG images onto a <canvas> element.
 * The RTP timestamps are used to schedule the drawing of the images.
 *
 * The following handlers can be set on a component instance:
 *  - onPlaying: will be called when the clock has started and
 *      the correct frame size has been set on the canvas.
 *
 * @class CanvasComponent
 * @extends {Component}
 */
class CanvasComponent extends Component {
  /**
   * Create a Canvas component.
   *
   * The constructor sets up two streams and connects them to the Canvas.
   * @param {HTMLCanvasElement} el - An HTML <canvas> element
   */
  constructor (el) {
    if (el === undefined) {
      throw new Error('canvas element argument missing')
    }

    const ctx = el.getContext('2d')

    let drawImageBlob
    if (typeof window.createImageBitmap !== 'undefined') {
      // The createImageBitmap function is supported in Chrome and Firefox
      // (https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
      drawImageBlob = ({blob}) => {
        window.createImageBitmap(blob).then((imageBitmap) => {
          ctx.drawImage(imageBitmap, 0, 0)
        })
      }
    } else {
      const img = new window.Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      drawImageBlob = ({blob}) => {
        const url = window.URL.createObjectURL(blob)
        img.src = url
      }
    }

    // Because we don't have an element that plays video for us,
    // we have to use our own clock. The clock can be started/stopped
    // with the `play` and `pause` methods, and has a `currentTime`
    // property that keeps track of the presentation time.
    // The scheduler will use the clock (instead of e.g. a video element)
    // to determine when to display the JPEG images.
    const clock = new Clock()
    const scheduler = new Scheduler(clock, drawImageBlob)
    let firstTimestamp = 0
    let clockrate = 0

    /**
     * Set up an incoming stream and attach it to the image drawing function.
     * @type {Writable}
     */
    const incoming = new Writable({
      objectMode: true,
      write: (msg, encoding, callback) => {
        if (msg.type === SDP) {
          // start of a new movie, reset timers
          clock.reset()
          scheduler.reset()

          // Initialize first timestamp and clockrate
          firstTimestamp = 0
          const jpegMedia = msg.sdp.media.find(
            media => media.type === 'video' && media.rtpmap && media.rtpmap.encodingName === 'JPEG'
          )
          clockrate = jpegMedia.rtpmap.clockrate

          callback()
        } else if (msg.type === JPEG) {
          const { timestamp } = msg

          // If first frame, store its timestamp, initialize
          // the scheduler with 0 and start the clock.
          // Also set the proper size on the canvas.
          if (!firstTimestamp) {
            // Initialize timing
            firstTimestamp = timestamp
            scheduler.init(0)
            clock.start()
            // Initialize frame size
            const {width, height} = msg.framesize
            el.width = width
            el.height = height
            // Notify that we're playing at this point
            this.onPlaying && this.onPlaying()
          }
          // Compute millisecond NTP timestamp (with offset 0)
          // as we initialized the scheduler with 0 as presentation time.
          const ntpTimestamp = 1000 * (timestamp - firstTimestamp) / clockrate
          const blob = new window.Blob([msg.data], { type: 'image/jpeg' })

          scheduler.run({ntpTimestamp, blob})

          callback()
        } else {
          callback()
        }
      }
    })

    /**
     * Set up outgoing stream.
     * @type {Writable}
     */
    const outgoing = new Readable({
      objectMode: true,
      read: function () {
        //
      }
    })

    // When an error is sent on the outgoing stream, whine about it.
    outgoing.on('error', () => {
      console.warn('outgoing stream broke somewhere')
    })

    /**
    * initialize the component.
    */
    super(incoming, outgoing)
  }
}

module.exports = CanvasComponent
