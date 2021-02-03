import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import debug from 'debug'
import { Sdp, pipelines, utils } from 'media-stream-library'

import { useEventState } from './hooks/useEventState'
import { VideoProperties, Range } from './PlaybackArea'
import {
  attachMetadataHandler,
  MetadataHandler,
  ScheduledMessage,
} from './metadata'

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
  readonly forwardedRef?: React.Ref<HTMLVideoElement>
  /**
   * The _intended_ playback state.
   */
  readonly play?: boolean
  /**
   * The source URI for the WebSocket server.
   */
  readonly ws?: string
  /**
   * The RTSP URI.
   */
  readonly rtsp?: string
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
  /**
   * Start playing from a specific offset (in seconds)
   */
  readonly offset?: number
}

export const WsRtspVideo: React.FC<WsRtspVideoProps> = ({
  forwardedRef,
  play = false,
  ws,
  rtsp,
  autoPlay = true,
  muted = true,
  onPlaying,
  onSdp,
  metadataHandler,
  offset = 0,
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

  // keep track of changes in starting time
  // (offset in seconds to start playing from)
  const __offsetRef = useRef(offset)
  const __rangeRef = useRef<Range>([offset, undefined])

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
        __onPlayingRef.current({
          el: videoEl,
          pipeline: pipeline ?? undefined,
          width: videoEl.videoWidth,
          height: videoEl.videoHeight,
          volume: pipeline?.tracks?.find((track) => track.type === 'audio')
            ? videoEl.volume
            : undefined,
          range: __rangeRef.current,
        })
      }
    }
  }, [play, canplay, playing, unsetPlaying, pipeline])

  // keep a stable reference to the external metadatahandler
  const __metadataHandlerRef = useRef(metadataHandler)
  __metadataHandlerRef.current = metadataHandler

  useEffect(() => {
    const videoEl = videoRef.current
    __offsetRef.current = offset

    if (
      ws !== undefined &&
      ws.length > 0 &&
      rtsp !== undefined &&
      rtsp.length > 0 &&
      videoEl !== null
    ) {
      debugLog('create pipeline', ws, rtsp)
      const newPipeline = new pipelines.Html5VideoPipeline({
        ws: { uri: ws },
        rtsp: { uri: rtsp },
        mediaElement: videoEl,
      })
      setPipeline(newPipeline)

      let scheduler: utils.Scheduler<ScheduledMessage> | undefined
      if (__metadataHandlerRef.current !== undefined) {
        scheduler = attachMetadataHandler(
          newPipeline,
          __metadataHandlerRef.current,
        )
      }

      return () => {
        debugLog('close pipeline and clear video')
        newPipeline.close()
        videoEl.src = ''
        scheduler?.reset()
        setPipeline(null)
        setFetching(false)
        unsetCanplay()
        unsetPlaying()
      }
    }
  }, [ws, rtsp, offset, unsetCanplay, unsetPlaying])

  // keep a stable reference to the external SDP handler
  const __onSdpRef = useRef(onSdp)
  __onSdpRef.current = onSdp

  useEffect(() => {
    if (play && pipeline && !fetching) {
      pipeline.ready
        .then(() => {
          pipeline.onSdp = (sdp) => {
            if (__onSdpRef.current !== undefined) {
              __onSdpRef.current(sdp)
            }
          }
          pipeline.rtsp.onPlay = (range) => {
            if (range !== undefined) {
              __rangeRef.current = [
                parseFloat(range[0]) || 0,
                parseFloat(range[1]) || undefined,
              ]
            }
          }
          pipeline.rtsp.play(__offsetRef.current)
        })
        .catch((err) => {
          console.error(err)
        })
      debugLog('initiated data fetching')
      setFetching(true)
    }
  }, [play, pipeline, fetching])

  return <VideoNative autoPlay={autoPlay} muted={muted} ref={videoRef} />
}
