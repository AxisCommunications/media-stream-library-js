import registerDebug from 'debug'

import { Sink } from '../component'
import { Writable, Readable } from 'stream'
import { MessageType, Message } from '../message'
import { packetType, BYE } from '../../utils/protocols/rtcp'
import { MediaTrack } from '../../utils/protocols/isom'

const TRIGGER_THRESHOLD = 100

const debug = registerDebug('msl:mse')

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
     */
    const incoming = new Writable({
      objectMode: true,
      write: (msg: Message, _, callback) => {
        if (msg.type === MessageType.ISOM) {
          // ISO BMFF Byte Stream data to be added to the source buffer
          this._done = callback

          if (msg.tracks !== undefined) {
            const tracks = msg.tracks
            // Start a new movie (new SDP info available)
            this._lastCheckpointTime = 0

            // Start a new mediaSource and prepare it with a sourceBuffer.
            // When ready, this component's .onSourceOpen callback will be called
            // with the mediaSource, and a list of valid/ignored media.
            mse = new MediaSource()
            el.src = window.URL.createObjectURL(mse)
            const handler = () => {
              mse.removeEventListener('sourceopen', handler)
              this.onSourceOpen && this.onSourceOpen(mse, tracks)

              // MIME codecs: https://tools.ietf.org/html/rfc6381
              const mimeCodecs = tracks
                .map((track) => track.mime)
                .filter((mime) => mime)
              const codecs =
                mimeCodecs.length !== 0
                  ? mimeCodecs.join(', ')
                  : 'avc1.640029, mp4a.40.2'
              sourceBuffer = this.addSourceBuffer(
                el,
                mse,
                `video/mp4; codecs="${codecs}"`,
              )
              sourceBuffer.onerror = (e) => {
                console.error('error on SourceBuffer: ', e)
                incoming.emit('error')
              }
              try {
                sourceBuffer.appendBuffer(msg.data)
              } catch (err) {
                console.error('failed to append to SourceBuffer: ', err, msg)
              }
            }
            mse.addEventListener('sourceopen', handler)
          } else {
            // Continue current movie
            this._lastCheckpointTime =
              msg.checkpointTime !== undefined
                ? msg.checkpointTime
                : this._lastCheckpointTime

            try {
              sourceBuffer.appendBuffer(msg.data)
            } catch (e) {
              console.error('failed to append to SourceBuffer: ', e, msg)
            }
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
      console.warn('incoming stream finished: end stream')
      mse && mse.readyState === 'open' && mse.endOfStream()
    })

    // When an error is sent on the incoming stream, close it.
    incoming.on('error', () => {
      console.error('error on incoming stream: end stream')
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
  addSourceBuffer(
    el: HTMLVideoElement,
    mse: MediaSource,
    mimeType: string,
  ): SourceBuffer {
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

  get currentTime(): number {
    return this._videoEl.currentTime
  }

  play(): Promise<void> {
    return this._videoEl.play()
  }

  pause(): void {
    return this._videoEl.pause()
  }
}
