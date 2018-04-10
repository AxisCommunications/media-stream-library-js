const {Readable, Writable} = require('stream')

const Component = require('../component')
const {SDP, JPEG} = require('../messageTypes')

class CanvasComponent extends Component {
  /**
   * Create a Canvas component.
   *
   * The constructor sets up two streams and connects them to the Canvas.
   *
   * @param {MediaSource} mse - A media source.
   */
  constructor (el) {
    if (el === undefined) {
      throw new Error('canvas element argument missing')
    }

    const ctx = el.getContext('2d')
    const {width: canvasWidth, height: canvasHeight} = el
    let frameWidth, frameHeight
    let imageWidth, imageHeight, imageLeft, imageTop

    let drawImageBlob
    if (typeof window.createImageBitmap !== 'undefined') {
      // The createImageBitmap function is supported in Chrome and Firefox
      // (https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
      drawImageBlob = (blob) => {
        window.createImageBitmap(blob).then((imageBitmap) => {
          ctx.drawImage(imageBitmap, imageLeft, imageTop, imageWidth, imageHeight)
        })
      }
    } else {
      const img = new window.Image()
      img.onload = () => {
        ctx.drawImage(img, imageLeft, imageTop, imageWidth, imageHeight)
      }
      drawImageBlob = (blob) => {
        const url = window.URL.createObjectURL(blob)
        img.src = url
      }
    }

    /**
     * Set up an incoming stream and attach it to the sourceBuffer.
     * @type {Writable}
     */
    const incoming = new Writable({
      objectMode: true,
      write: (msg, encoding, callback) => {
        if (msg.type === SDP) {
          ({width: frameWidth, height: frameHeight} = msg.framesize)
          const scaleWidth = frameWidth / canvasWidth
          const scaleHeight = frameHeight / canvasHeight
          const scale = Math.max(scaleWidth, scaleHeight)

          imageWidth = frameWidth / scale
          imageHeight = frameHeight / scale
          imageLeft = (canvasWidth - imageWidth) / 2
          imageTop = (canvasHeight - imageHeight) / 2

          callback(null, msg)
        } else if (msg.type === JPEG) {
          const blob = new window.Blob([msg.data], { type: 'image/jpeg' })
          drawImageBlob(blob)
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
      read () {
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
