import { Sink } from '../component'
import { Writable, Readable } from 'stream'
import { MessageType, Message } from '../message'
import { packetType, BYE } from '../../utils/protocols/rtcp'

const TRIGGER_THRESHOLD = 100

export interface MediaTrack {
  type: string
  encoding?: string
  mime?: string
  codec?: any
}

export class MseSink extends Sink {
  private _videoEl: HTMLVideoElement
  private _done?: () => void
  private _lastCheckpointTime: number

  public onSourceOpen?: (mse: MediaSource, tracks: MediaTrack[]) => void

  /**
   * Create a Media component.
   *
   * The constructor sets up two streams and connects them to the MediaSource.
   *
   * @param {MediaSource} mse - A media source.
   */
  constructor(el: HTMLVideoElement) {
    if (el === undefined) {
      throw new Error('video element argument missing')
    }

    let mse: MediaSource
    let sourceBuffer: SourceBuffer

    /**
     * Set up an incoming stream and attach it to the sourceBuffer.
     * @type {Writable}
     */
    const incoming = new Writable({
      objectMode: true,
      write: (msg: Message, encoding, callback) => {
        if (msg.type === MessageType.SDP) {
          // Start a new movie (new SDP info available)
          this._lastCheckpointTime = 0

          // Set up a list of tracks that contain info about
          // the type of media, encoding, and codec are present.
          const tracks = msg.sdp.media.map((media) => {
            return {
              type: media.type,
              encoding: media.rtpmap && media.rtpmap.encodingName,
              mime: media.mime,
              codec: media.codec,
            }
          })

          // Start a new mediaSource and prepare it with a sourceBuffer.
          // When ready, this component's .onSourceOpen callback will be called
          // with the mediaSource, and a list of valid/ignored media.
          mse = new MediaSource()
          el.src = window.URL.createObjectURL(mse)
          const handler = () => {
            mse.removeEventListener('sourceopen', handler)
            this.onSourceOpen && this.onSourceOpen(mse, tracks)
            const mimeCodecs = tracks
              .map((track) => track.mime)
              .filter((mime) => mime)
              .join(', ')
            sourceBuffer = this.addSourceBuffer(
              el,
              mse,
              `video/mp4; codecs="${mimeCodecs}"`,
            )
            callback()
          }
          mse.addEventListener('sourceopen', handler)
        } else if (msg.type === MessageType.ISOM) {
          this._lastCheckpointTime =
            msg.checkpointTime !== undefined
              ? msg.checkpointTime
              : this._lastCheckpointTime
          // ISO BMFF Byte Stream data to be added to the source buffer
          this._done = callback
          try {
            sourceBuffer.appendBuffer(msg.data)
          } catch (e) {
            // do nothing
          }
        } else if (msg.type === MessageType.RTCP) {
          if (packetType(msg.data) === BYE.packetType) {
            mse.readyState === 'open' && mse.endOfStream()
          }
          callback()
        } else {
          callback()
        }
      },
    })

    incoming.on('finish', () => {
      mse && mse.readyState === 'open' && mse.endOfStream()
    })

    // When an error is sent on the incoming stream, close it.
    incoming.on('error', () => {
      if (sourceBuffer.updating) {
        sourceBuffer.addEventListener('updateend', () => {
          mse.readyState === 'open' && mse.endOfStream()
        })
      } else {
        mse.readyState === 'open' && mse.endOfStream()
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
      },
    })

    // When an error is sent on the outgoing stream, whine about it.
    outgoing.on('error', () => {
      console.warn('outgoing stream broke somewhere')
    })

    /**
     * initialize the component.
     */
    super(incoming, outgoing)

    this._videoEl = el
    this._lastCheckpointTime = 0
  }

  /**
   * Add a new sourceBuffer to the mediaSource and remove old ones.
   * @param {HTMLMediaElement} el  The media element holding the media source.
   * @param {MediaSource} mse  The media source the buffer should be attached to.
   * @param {String} [mimeType='video/mp4; codecs="avc1.4D0029, mp4a.40.2"'] [description]
   */
  addSourceBuffer(el: HTMLVideoElement, mse: MediaSource, mimeType: string) {
    const sourceBuffer = mse.addSourceBuffer(mimeType)

    let trigger = 0
    const onUpdateEndHandler = () => {
      ++trigger

      if (trigger > TRIGGER_THRESHOLD && sourceBuffer.buffered.length) {
        trigger = 0

        const index = sourceBuffer.buffered.length - 1
        const start = sourceBuffer.buffered.start(index)
        const end = Math.min(el.currentTime, this._lastCheckpointTime) - 10
        try {
          // remove all material up to 10 seconds before current time
          if (end > start) {
            sourceBuffer.remove(start, end)

            return // this._done() will be called on the next updateend event!
          }
        } catch (e) {
          console.warn(e)
        }
      }
      this._done && this._done()
    }
    sourceBuffer.addEventListener('updateend', onUpdateEndHandler)

    return sourceBuffer
  }

  get currentTime() {
    return this._videoEl.currentTime
  }

  play() {
    return this._videoEl.play()
  }

  pause() {
    return this._videoEl.pause()
  }
}
