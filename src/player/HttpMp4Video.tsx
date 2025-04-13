import React, { useEffect, useRef, useState } from 'react'

import { HttpMp4Pipeline, TransformationMatrix } from '../streams'

import { VideoProperties } from './PlaybackArea'
import { FORMAT_SUPPORTS_AUDIO } from './constants'
import { useEventState } from './hooks/useEventState'
import { MetadataHandler } from './metadata'
import { Format } from './types'
import { logDebug } from './utils/log'

/**
 * WebSocket + RTSP playback component.
 */

interface HttpMp4VideoProps {
  readonly forwardedRef?: React.Ref<HTMLVideoElement>
  /**
   * The _intended_ playback state.
   */
  readonly play?: boolean
  /**
   * The HTTP/HTTPS source for the MP4 data (URI).
   */
  readonly src?: string
  /**
   * Activate automatic playback.
   */
  readonly autoPlay?: boolean
  /**
   * Default mute state.
   */
  readonly muted?: boolean
  /**
   * Callback to signal video is playing.
   */
  readonly onPlaying?: (videoProperties: VideoProperties) => void
  /**
   * Callback to signal video ended.
   */
  readonly onEnded?: () => void

  readonly metadataHandler?: MetadataHandler
}

export const HttpMp4Video: React.FC<HttpMp4VideoProps> = ({
  forwardedRef,
  play = false,
  src,
  autoPlay = true,
  muted = true,
  onPlaying,
  onEnded,
  metadataHandler,
}) => {
  let videoRef = useRef<HTMLVideoElement>(null)

  // Forwarded refs can either be a callback or the result of useRef
  if (typeof forwardedRef === 'function') {
    forwardedRef(videoRef.current)
  } else if (forwardedRef) {
    videoRef = forwardedRef
  }

  /**
   * Internal state:
   * -> canplay: there is enough data on the video element to play.
   * -> playing: the video element playback is progressing.
   */
  const [canplay, unsetCanplay] = useEventState(videoRef, 'canplay')
  const [playing, unsetPlaying] = useEventState(videoRef, 'playing')

  // State tied to resources
  const [pipeline, setPipeline] = useState<null | HttpMp4Pipeline>(null)
  const [fetching, setFetching] = useState(false)

  // keep a stable reference to the external onPlaying callback
  const __onPlayingRef = useRef(onPlaying)
  __onPlayingRef.current = onPlaying

  // keep a stable reference to the external onEnded callback
  const __onEndedRef = useRef(onEnded)
  __onEndedRef.current = onEnded

  const __sensorTmRef = useRef<TransformationMatrix>(undefined)
  const __mimeRef = useRef<string>('video/mp4')

  useEffect(() => {
    const videoEl = videoRef.current

    if (videoEl === null) {
      return
    }

    if (play && canplay === true && playing === false) {
      logDebug('play')
      videoEl.play().catch((err) => {
        console.error('VideoElement error: ', err.message)
      })

      const { videoHeight, videoWidth } = videoEl
      logDebug(`resolution: ${videoWidth}x${videoHeight}`)
    } else if (!play && playing === true) {
      logDebug('pause')
      videoEl.pause()
      unsetPlaying()
    } else if (play && playing === true) {
      if (__onPlayingRef.current !== undefined) {
        __onPlayingRef.current({
          el: videoEl,
          formatSupportsAudio: FORMAT_SUPPORTS_AUDIO[Format.MP4_H264],
          height: videoEl.videoHeight,
          mime: __mimeRef.current,
          pipeline: pipeline ?? undefined,
          sensorTm: __sensorTmRef.current,
          volume: videoEl.volume,
          width: videoEl.videoWidth,
        })
      }
    }
  }, [play, canplay, playing, unsetPlaying, pipeline])

  // keep a stable reference to the external metadatahandler
  const __metadataHandlerRef = useRef(metadataHandler)
  __metadataHandlerRef.current = metadataHandler

  useEffect(() => {
    const videoEl = videoRef.current

    if (src !== undefined && src.length > 0 && videoEl !== null) {
      logDebug('create pipeline', src)
      const newPipeline = new HttpMp4Pipeline({
        uri: src,
        mediaElement: videoEl,
      })
      setPipeline(newPipeline)

      return () => {
        logDebug('close pipeline and clear video')
        newPipeline.close()
        videoEl.src = ''
        setPipeline(null)
        setFetching(false)
        unsetCanplay()
        unsetPlaying()
      }
    }
  }, [src, unsetCanplay, unsetPlaying])

  useEffect(() => {
    if (play && pipeline && !fetching) {
      const endedCallback = () => {
        __onEndedRef.current?.()
      }
      pipeline
        .start()
        .then(({ headers, finished }) => {
          __mimeRef.current = headers.get('content-type') ?? 'video/mp4'
          __sensorTmRef.current = parseTransformHeader(
            headers.get('video-sensor-transform') ??
              headers.get('video-metadata-transform')
          )
          finished.finally(() => {
            endedCallback()
          })
        })
        .catch((err) => {
          console.error('failed to fetch video stream:', err)
        })
      logDebug('initiated data fetching')
      setFetching(true)
    }
  }, [play, pipeline, fetching])

  return (
    <video
      style={{ maxHeight: '100%', objectFit: 'contain', width: '100%' }}
      autoPlay={autoPlay}
      muted={muted}
      ref={videoRef}
    />
  )
}

const parseTransformHeader = (
  value: string | null | undefined
): TransformationMatrix | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }
  return value
    .split(';')
    .map((row) => row.split(',').map(Number)) as unknown as TransformationMatrix
}
