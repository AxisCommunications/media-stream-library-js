const {Readable, Writable} = require('stream')

const Component = require('../component')
const {JPEG} = require('../messageTypes')

class CanvasComponent extends Component {
  /**
   * Create a Canvas component.
   *
   * The constructor sets up two streams and connects them to the Canvas.
   * JPEG images will be drawn at the rate they come through the stream,
   * currently no clock is implemented to schedule presentation.
   *
   * @param {MediaSource} mse - A media source.
   */
  constructor (el) {
    if (el === undefined) {
      throw new Error('canvas element argument missing')
    }

    const ctx = el.getContext('2d')
    const {width: canvasWidth, height: canvasHeight} = el

    const fitToCanvas = (width, height) => {
      const scaleWidth = canvasWidth / width
      const scaleHeight = canvasHeight / height
      const scale = Math.min(scaleWidth, scaleHeight)

      return {
        width: width * scale,
        height: height * scale,
        x: (canvasWidth - width * scale) / 2,
        y: (canvasHeight - height * scale) / 2
      }
    }

    let drawImageBlob
    if (typeof window.createImageBitmap !== 'undefined') {
      // The createImageBitmap function is supported in Chrome and Firefox
      // (https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
      drawImageBlob = (blob, bbox) => {
        window.createImageBitmap(blob).then((imageBitmap) => {
          ctx.drawImage(imageBitmap, bbox.x, bbox.y, bbox.width, bbox.height)
        })
      }
    } else {
      const img = new window.Image()
      img.onload = () => {
        const bbox = this.bbox
        ctx.drawImage(img, bbox.x, bbox.y, bbox.width, bbox.height)
      }
      drawImageBlob = (blob, bbox) => {
        const url = window.URL.createObjectURL(blob)
        this.bbox = bbox
        img.src = url
      }
    }

    /**
     * Set up an incoming stream and attach it to the image drawing function.
     * @type {Writable}
     */
    const incoming = new Writable({
      objectMode: true,
      write: (msg, encoding, callback) => {
        if (msg.type === JPEG) {
          const { width, height } = msg.size
          const bbox = fitToCanvas(width, height)
          const blob = new window.Blob([msg.data], { type: 'image/jpeg' })

          drawImageBlob(blob, bbox)

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
