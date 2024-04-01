import React, { useEffect, useRef, useState } from 'react'

import debug from 'debug'
import { pipelines, TransformationMatrix } from 'media-stream-library'
import styled from 'styled-components'

import { FORMAT_SUPPORTS_AUDIO } from './constants'
import { useEventState } from './hooks/useEventState'
import { useVideoDebug } from './hooks/useVideoDebug'
import { MetadataHandler } from './metadata'
import { VideoProperties } from './PlaybackArea'
import { Format } from './types'

const debugLog = debug('msp:http-mp4-video')

const VideoNative = styled.video`
  max-height: 100%;
  object-fit: contain;
  width: 100%;
`

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
  const [pipeline, setPipeline] = useState<null | pipelines.HttpMsePipeline>(
    null
  )
  const [fetching, setFetching] = useState(false)

  // keep a stable reference to the external onPlaying callback
  const __onPlayingRef = useRef(onPlaying)
  __onPlayingRef.current = onPlaying

  // keep a stable reference to the external onEnded callback
  const __onEndedRef = useRef(onEnded)
  __onEndedRef.current = onEnded

  const __sensorTmRef = useRef<TransformationMatrix>()

  useVideoDebug(videoRef.current, debugLog)

  useEffect(() => {
    const videoEl = videoRef.current

    if (videoEl === null) {
      return
    }

    if (play && canplay === true && playing === false) {
      debugLog('play')
      videoEl.play().catch((err) => {
        console.error('VideoElement error: ', err.message)
      })

      const { videoHeight, videoWidth } = videoEl
      debugLog('%o', {
        videoHeight,
        videoWidth,
      })
    } else if (!play && playing === true) {
      debugLog('pause')
      videoEl.pause()
      unsetPlaying()
    } else if (play && playing === true) {
      if (__onPlayingRef.current !== undefined) {
        __onPlayingRef.current({
          el: videoEl,
          width: videoEl.videoWidth,
          height: videoEl.videoHeight,
          sensorTm: __sensorTmRef.current,
          formatSupportsAudio: FORMAT_SUPPORTS_AUDIO[Format.MP4_H264],
          // TODO: no volume, need to expose tracks?
          // TODO: no pipeline, can we even get stats?
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
      const endedCallback = () => {
        __onEndedRef.current?.()
      }
      debugLog('create pipeline', src)
      const newPipeline = new pipelines.HttpMsePipeline({
        http: { uri: src },
        mediaElement: videoEl,
      })
      setPipeline(newPipeline)

      newPipeline.onServerClose = endedCallback

      return () => {
        debugLog('close pipeline and clear video')
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
      pipeline.onHeaders = (headers) => {
        __sensorTmRef.current = parseTransformHeader(
          headers.get('video-sensor-transform') ??
            headers.get('video-metadata-transform')
        )
      }
      pipeline.http.play()
      debugLog('initiated data fetching')
      setFetching(true)
    }
  }, [play, pipeline, fetching])

  return <VideoNative autoPlay={autoPlay} muted={muted} ref={videoRef} />
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
