import { logDebug, logError, logInfo } from '../log'

import { IsomMessage } from './types'

/**
 * Media component.
 *
 * Provides a writeable stream for ISOM messages that are passed to the
 * user's video element through a source buffer, and frees the source
 * buffer at regular intervals (keeping at least 1 I-frame in the buffer).
 *
 * The MIME type of the media stream can be provided when instantiating
 * the sink, or it can be passed in-band by adding track information to
 * the first ISOM message (e.g. by the MP4 muxer).
 */
export class MseSink {
  public readonly mediaSource: MediaSource = new MediaSource()
  public readonly writable: WritableStream<IsomMessage>

  /** A function that will peek at ISOM messages, useful for example for capturing the MP4 data. */
  public onMessage?: (msg: IsomMessage) => void

  private lastCheckpointTime: number
  private sourceBuffer?: Promise<SourceBuffer>
  private videoEl: HTMLVideoElement

  constructor(videoEl: HTMLVideoElement, mimeType?: string) {
    this.lastCheckpointTime = 0
    this.videoEl = videoEl

    if (mimeType !== undefined) {
      this.sourceBuffer = newSourceBuffer(
        this.mediaSource,
        this.videoEl,
        mimeType
      )
    }

    this.writable = new WritableStream({
      write: async (msg: IsomMessage, controller) => {
        if (msg.mimeType !== undefined) {
          this.sourceBuffer = newSourceBuffer(
            this.mediaSource,
            this.videoEl,
            msg.mimeType
          )
        }

        if (!this.sourceBuffer) {
          controller.error(
            'missing SourceBuffer, either initialize with MIME type or use MP4 muxer'
          )
          return
        }

        const sourceBuffer = await this.sourceBuffer

        const checkpoint = this.updateCheckpointTime(msg.checkpointTime)
        if (checkpoint !== undefined) {
          await freeBuffer(sourceBuffer, checkpoint)
        }

        if (this.onMessage) {
          this.onMessage(msg)
        }

        await appendBuffer(sourceBuffer, msg.data)
      },
      close: async () => {
        logDebug('media stream complete')
        this.endOfStream()
      },
      abort: async (reason) => {
        logError('media stream aborted:', reason)
        this.endOfStream()
      },
    })
  }

  private updateCheckpointTime(checkpointTime?: number): number | undefined {
    this.lastCheckpointTime = checkpointTime ?? this.lastCheckpointTime
    if (
      this.lastCheckpointTime === 0 ||
      Math.floor(this.lastCheckpointTime) % 10 !== 0
    ) {
      return
    }
    return Math.floor(
      Math.min(this.videoEl.currentTime, this.lastCheckpointTime) - 10
    )
  }

  private async endOfStream() {
    const endOfStream = () => {
      this.mediaSource.readyState === 'open' && this.mediaSource.endOfStream()
    }
    const sourceBuffer = await this.sourceBuffer
    if (sourceBuffer && sourceBuffer.updating) {
      sourceBuffer.addEventListener('updateend', endOfStream, { once: true })
    } else {
      endOfStream()
    }
  }
}

async function freeBuffer(sourceBuffer: SourceBuffer, end: number) {
  if (sourceBuffer.buffered.length === 0) {
    return
  }
  const index = sourceBuffer.buffered.length - 1
  const start = sourceBuffer.buffered.start(index)
  if (end > start) {
    return new Promise((resolve, reject) => {
      try {
        sourceBuffer.addEventListener('updateend', resolve, { once: true })
        sourceBuffer.remove(start, end)
      } catch (err) {
        reject(err)
      }
    })
  }
}

async function appendBuffer(sourceBuffer: SourceBuffer, data: Uint8Array) {
  return new Promise((resolve, reject) => {
    try {
      sourceBuffer.addEventListener('updateend', resolve, { once: true })
      sourceBuffer.appendBuffer(data)
    } catch (err) {
      reject(err)
    }
  })
}

async function newSourceBuffer(
  mse: MediaSource,
  el: HTMLVideoElement,
  mimeType: string
): Promise<SourceBuffer> {
  // Start a new mediaSource and prepare it with a sourceBuffer.
  await new Promise((resolve, reject) => {
    try {
      mse.addEventListener('sourceopen', resolve, { once: true })
      el.src = window.URL.createObjectURL(mse)
    } catch (err) {
      reject(err)
    }
  })

  mse.duration = 0

  // // revoke the object URL to avoid a memory leak
  window.URL.revokeObjectURL(el.src)

  if (!MediaSource.isTypeSupported(mimeType)) {
    throw new Error(`unsupported media type: ${mimeType}`)
  } else {
    logInfo('adding SourceBuffer with MIME type:', mimeType)
  }

  return mse.addSourceBuffer(mimeType)
}
