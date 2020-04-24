import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import debug from 'debug'

import { Sdp } from 'media-stream-library/dist/esm/utils/protocols'
import { pipelines } from 'media-stream-library/dist/esm/index.browser'

import useEventState from './hooks/useEventState'
import { VideoProperties } from './PlaybackArea'
import { attachMetadataHandler, MetadataHandler } from './metadata'

const debugLog = debug('msp:ws-rtsp-video')

const VideoNative = styled.video`
  max-height: 100%;
  object-fit: contain;
  width: 100%;
`

/**
 * WebSocket + RTSP playback component.
 */

interface WsRtspVideoProps {
  forwardedRef?: React.Ref<HTMLVideoElement>
  /**
   * The _intended_ playback state.
   */
  play?: boolean
  /**
   * The source URI for the WebSocket server.
   */
  ws?: string
  /**
   * The RTSP URI.
   */
  rtsp?: string
  /**
   * Activate automatic playback.
   */
  autoPlay?: boolean
  /**
   * Default mute state.
   */
  muted?: boolean
  /**
   * Callback to signal video is playing.
   */
  onPlaying: (videoProperties: VideoProperties) => void
  onSdp?: (msg: Sdp) => void
  metadataHandler?: MetadataHandler
}

export const WsRtspVideo: React.FC<WsRtspVideoProps> = ({
  forwardedRef,
  play,
  ws,
  rtsp,
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
  const [pipeline, setPipeline] = useState<null | pipelines.Html5VideoPipeline>(
    null,
  )
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    const videoEl = videoRef.current

    if (videoEl === null) {
      return
    }

    if (play && canplay && !playing) {
      debugLog('play')
      videoEl.play().catch((err) => {
        console.error('VideoElement error: ', err.message)
      })
    } else if (!play && playing) {
      debugLog('pause')
      videoEl.pause()
      unsetPlaying()
    } else if (play && playing) {
      onPlaying({
        el: videoEl,
        width: videoEl.videoWidth,
        height: videoEl.videoHeight,
      })
    }
  }, [play, canplay, playing])

  useEffect(() => {
    const videoEl = videoRef.current

    if (videoEl === null) {
      return
    }

    if (!ws || !rtsp) {
      debugLog('src removed')
      videoEl.src = ''
      unsetCanplay()
      unsetPlaying()
    } else if (videoRef.current) {
      debugLog('create pipeline', ws, rtsp)
      const pipeline = new pipelines.Html5VideoPipeline({
        ws: { uri: ws },
        rtsp: { uri: rtsp },
        mediaElement: videoRef.current,
      })
      setPipeline(pipeline)

      if (metadataHandler !== undefined) {
        attachMetadataHandler(pipeline, metadataHandler)
      }

      return () => {
        debugLog('destroy pipeline')
        pipeline.close()
        setPipeline(null)
        setFetching(false)
      }
    }
  }, [ws, rtsp])

  // keep a stable reference to the external SDP handler
  const __onSdpRef = useRef(onSdp)
  __onSdpRef.current = onSdp

  useEffect(() => {
    if (play && pipeline && !fetching) {
      pipeline.ready.then(() => {
        debugLog('fetch')
        pipeline.onSdp = (sdp) => {
          if (__onSdpRef.current !== undefined) {
            __onSdpRef.current(sdp)
          }
        }
        pipeline.rtsp.play()
        setFetching(true)
      })
    }
  }, [play, pipeline, fetching])

  return <VideoNative autoPlay={autoPlay} muted={muted} ref={videoRef} />
}
