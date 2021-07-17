import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import debug from 'debug'
import { Sdp, pipelines } from 'media-stream-library'

import { useEventState } from './hooks/useEventState'
import { VideoProperties } from './PlaybackArea'
import { MetadataHandler } from './metadata'
import { fetchTransformationMatrix } from './utils'

const debugLog = debug('msp:ws-rtsp-video')

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
  readonly onSdp?: (msg: Sdp) => void
  readonly metadataHandler?: MetadataHandler
}

export const HttpMp4Video: React.FC<HttpMp4VideoProps> = ({
  forwardedRef,
  play = false,
  src,
  autoPlay = true,
  muted = true,
  onPlaying,
  onSdp,
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
    null,
  )
  const [fetching, setFetching] = useState(false)

  // keep a stable reference to the external onPlaying callback
  const __onPlayingRef = useRef(onPlaying)
  __onPlayingRef.current = onPlaying

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
    } else if (!play && playing === true) {
      debugLog('pause')
      videoEl.pause()
      unsetPlaying()
    } else if (play && playing === true) {
      if (__onPlayingRef.current !== undefined) {
        const onPlayingCallback = __onPlayingRef.current
        const baseVideoProperties = {
          el: videoEl,
          width: videoEl.videoWidth,
          height: videoEl.videoHeight,
          // TODO: no volume, need to expose tracks?
          // TODO: no pipeline, can we even get stats?
        }
        fetchTransformationMatrix('sensor')
          .then((sensorTm) => {
            onPlayingCallback({
              ...baseVideoProperties,
              sensorTm,
            })
          })
          .catch((err) => {
            console.error('failed to fetch transformation matrix: ', err)
            onPlayingCallback(baseVideoProperties)
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
      debugLog('create pipeline', src)
      const newPipeline = new pipelines.HttpMsePipeline({
        http: { uri: src },
        mediaElement: videoEl,
      })
      setPipeline(newPipeline)

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

  // keep a stable reference to the external SDP handler
  const __onSdpRef = useRef(onSdp)
  __onSdpRef.current = onSdp

  useEffect(() => {
    if (play && pipeline && !fetching) {
      // TODO: how to get hold of the transformation matrix?
      pipeline.http.play()
      debugLog('initiated data fetching')
      setFetching(true)
    }
  }, [play, pipeline, fetching])

  return <VideoNative autoPlay={autoPlay} muted={muted} ref={videoRef} />
}
