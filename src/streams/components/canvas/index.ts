import type { JpegMessage } from '../types/jpeg'
import { SdpMessage, isJpegMedia } from '../types/sdp'

import { Clock } from '../utils/clock'
import { Scheduler } from '../utils/scheduler'

interface BlobMessage {
  readonly blob: Blob
  readonly ntpTimestamp: number
}

type BlobMessageHandler = (msg: BlobMessage) => void

interface RateInfo {
  bitrate: number
  framerate: number
  renderedFrames: number
}

const resetInfo = (info: RateInfo) => {
  info.bitrate = 0
  info.framerate = 0
  info.renderedFrames = 0
}

interface ByteDuration {
  byteLength: number
  duration: number
}

const generateUpdateInfo = (clockrate: number) => {
  let cumulativeByteLength = 0
  let cumulativeDuration = 0
  let cumulativeFrames = 0

  return (info: RateInfo, { byteLength, duration }: ByteDuration) => {
    cumulativeByteLength += byteLength
    cumulativeDuration += duration
    cumulativeFrames++

    // Update the cumulative number size (bytes) and duration (ticks), and if
    // the duration exceeds the clockrate (meaning longer than 1 second of info),
    // then compute a new bitrate and reset cumulative size and duration.
    if (cumulativeDuration >= clockrate) {
      const bits = 8 * cumulativeByteLength
      const frames = cumulativeFrames
      const seconds = cumulativeDuration / clockrate
      info.bitrate = bits / seconds
      info.framerate = frames / seconds
      cumulativeByteLength = 0
      cumulativeDuration = 0
      cumulativeFrames = 0
    }
  }
}

/**
 * Draws an incoming stream of JPEG images onto a <canvas> element.
 * The RTP timestamps are used to schedule the drawing of the images.
 * An instance can be used as a 'clock' itself, e.g. with a scheduler.
 */
export class CanvasSink {
  public readonly writable: WritableStream<JpegMessage>

  /** Resolves when the first frame is ready and the correct frame size
   * has been set on the canvas. At this point, the clock can be started by
   * calling `.play()` method on the component. */
  public readonly canplay: Promise<void>

  /** Called when the (approximate) real time corresponding to the start of the
   * video is known, extrapolated from the first available NTP timestamp and
   * the duration represented by RTP timestamps since the first frame. */
  public onSync?: (videoStartTime: number) => void

  private readonly clock: Clock
  private readonly scheduler: Scheduler<BlobMessage>
  private readonly info: RateInfo
  /**
   * @param  el - The <canvas> element to draw incoming JPEG messages on.
   */
  constructor(el: HTMLCanvasElement) {
    if (el === undefined) {
      throw new Error('canvas element argument missing')
    }

    let firstTimestamp = 0
    let lastTimestamp = 0
    let clockrate = 0
    const info = {
      bitrate: 0,
      framerate: 0,
      renderedFrames: 0,
    }
    let updateInfo: (info: RateInfo, update: ByteDuration) => void

    // The createImageBitmap function is supported in Chrome and Firefox
    // (https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
    // Note: drawImage can also be used instead of transferFromImageBitmap, but it caused
    // very large memory use in Chrome (goes up to ~2-3GB, then drops again).
    // Do do not call el.getContext twice, safari returns null for second call
    let ctx: ImageBitmapRenderingContext | CanvasRenderingContext2D | null =
      null
    if (window.createImageBitmap !== undefined) {
      ctx = el.getContext('bitmaprenderer')
    }
    if (ctx === null) {
      ctx = el.getContext('2d')
    }

    // Set up the drawing callback to be used by the scheduler,
    // it receives a blob of a JPEG image.
    let drawImageBlob: BlobMessageHandler
    if (ctx === null) {
      drawImageBlob = () => {
        /** NOOP */
      }
    } else if ('transferFromImageBitmap' in ctx) {
      const ctxBitmaprenderer = ctx
      drawImageBlob = ({ blob }) => {
        info.renderedFrames++
        window
          .createImageBitmap(blob)
          .then((imageBitmap) => {
            ctxBitmaprenderer.transferFromImageBitmap(imageBitmap)
          })
          .catch(() => {
            /** ignore */
          })
      }
    } else {
      const ctx2d = ctx
      const img = new Image()
      img.onload = () => {
        ctx2d.drawImage(img, 0, 0)
      }
      drawImageBlob = ({ blob }) => {
        info.renderedFrames++
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

    let videoStartTime = 0
    const onSync = (npt: number) => {
      this.onSync && this.onSync(npt)
    }

    let resolveCanPlay: VoidFunction
    this.canplay = new Promise((resolve) => {
      resolveCanPlay = resolve
    })

    // Set up an incoming stream and attach it to the image drawing function.
    this.writable = new WritableStream<SdpMessage | JpegMessage>({
      write: (msg, controller) => {
        if (msg.type === 'sdp') {
          // start of a new movie, reset timers
          clock.reset()
          scheduler.reset()

          // Initialize first timestamp and clockrate
          firstTimestamp = 0
          const jpegMedia = msg.media.find(isJpegMedia)
          clockrate = jpegMedia?.rtpmap?.clockrate ?? 0

          if (clockrate === 0) {
            controller.error(
              'invalid clockrate, either no JPEG media present or it has no clockrate'
            )
            return
          }

          // Initialize the framerate/bitrate data
          resetInfo(info)
          updateInfo = generateUpdateInfo(clockrate)
          return
        }

        const { timestamp, ntpTimestamp } = msg

        // If first frame, store its timestamp, initialize
        // the scheduler with 0 and start the clock.
        // Also set the proper size on the canvas.
        if (!firstTimestamp) {
          // Initialize timing
          firstTimestamp = timestamp
          lastTimestamp = timestamp
          // Initialize frame size
          const { width, height } = msg.framesize
          el.width = width
          el.height = height
          // Notify that we can play at this point
          scheduler.init(0)
        }
        // Compute millisecond presentation time (with offset 0
        // as we initialized the scheduler with 0).
        const presentationTime =
          (1000 * (timestamp - firstTimestamp)) / clockrate
        const blob = new window.Blob([msg.data], { type: 'image/jpeg' })

        // If the actual UTC time of the start of presentation isn't known yet,
        // and we do have an ntpTimestamp, then compute it here and notify.
        if (!videoStartTime && ntpTimestamp) {
          videoStartTime = ntpTimestamp - presentationTime
          onSync(videoStartTime)
        }

        scheduler.run({
          ntpTimestamp: presentationTime,
          blob,
        })

        // Notify that we can now start the clock.
        if (timestamp === firstTimestamp) {
          resolveCanPlay()
        }

        // Update bitrate/framerate
        updateInfo(info, {
          byteLength: msg.data.length,
          duration: timestamp - lastTimestamp,
        })
        lastTimestamp = timestamp
      },
    })

    this.clock = clock
    this.scheduler = scheduler
    this.info = info

    this.onSync = undefined
  }

  /**
   * Retrieve the current presentation time (seconds)
   */
  get currentTime() {
    return this.clock.currentTime
  }

  /**
   * Pause the presentation.
   */
  pause() {
    this.scheduler.suspend()
    this.clock.pause()
  }

  /**
   * Start the presentation.
   */
  async play() {
    await this.canplay
    this.clock.play()
    this.scheduler.resume()
  }

  get bitrate() {
    return this.info.bitrate
  }

  get framerate() {
    return this.info.framerate
  }
}
