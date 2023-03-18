import React, { useEffect, useRef, useState } from 'react'

import debug from 'debug'
import {
  isRtcpBye,
  pipelines,
  Rtcp,
  Sdp,
  TransformationMatrix,
  utils,
  VideoMedia,
} from 'media-stream-library'
import styled from 'styled-components'

import { FORMAT_SUPPORTS_AUDIO } from './constants'
import { useEventState } from './hooks/useEventState'
import { useVideoDebug } from './hooks/useVideoDebug'
import {
  attachMetadataHandler,
  MetadataHandler,
  ScheduledMessage,
} from './metadata'
import { Range, VideoProperties } from './PlaybackArea'
import { Format } from './types'

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
  /**
   * Callback to signal video ended.
   */
  readonly onEnded?: () => void
  /**
   * Callback when SDP data is received.
   */
  readonly onSdp?: (msg: Sdp) => void
  /**
   * Callback when RTCP data is received.
   */
  readonly onRtcp?: (msg: Rtcp) => void
  readonly metadataHandler?: MetadataHandler
  /**
   * Start playing from a specific offset (in seconds)
   */
  readonly offset?: number

  /**
   * Activate automatic retries on RTSP errors.
   */
  readonly autoRetry?: boolean
}

export const WsRtspVideo: React.FC<WsRtspVideoProps> = ({
  forwardedRef,
  play = false,
  ws,
  rtsp,
  autoPlay = true,
  muted = true,
  onPlaying,
  onEnded,
  onSdp,
  onRtcp,
  metadataHandler,
  offset = 0,
  autoRetry = false,
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
    null
  )
  const [fetching, setFetching] = useState(false)

  // keep track of changes in starting time
  // (offset in seconds to start playing from)
  const __offsetRef = useRef(offset)
  const __rangeRef = useRef<Range>([offset, undefined])

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
          pipeline: pipeline ?? undefined,
          width: videoEl.videoWidth,
          height: videoEl.videoHeight,
          formatSupportsAudio: FORMAT_SUPPORTS_AUDIO[Format.RTP_H264],
          volume: pipeline?.tracks?.find((track) => track.type === 'audio')
            ? videoEl.volume
            : undefined,
          range: __rangeRef.current,
          sensorTm: __sensorTmRef.current,
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
      ws !== undefined
      && ws.length > 0
      && rtsp !== undefined
      && rtsp.length > 0
      && videoEl !== null
    ) {
      debugLog('create pipeline', ws, rtsp)
      const newPipeline = new pipelines.Html5VideoPipeline({
        ws: { uri: ws },
        rtsp: { uri: rtsp },
        mediaElement: videoEl,
      })
      if (autoRetry) {
        utils.addRTSPRetry(newPipeline.rtsp)
      }
      setPipeline(newPipeline)

      let scheduler: utils.Scheduler<ScheduledMessage> | undefined
      if (__metadataHandlerRef.current !== undefined) {
        scheduler = attachMetadataHandler(
          newPipeline,
          __metadataHandlerRef.current
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
  }, [ws, rtsp, offset, unsetCanplay, unsetPlaying, autoRetry])

  // keep a stable reference to the external SDP handler
  const __onSdpRef = useRef(onSdp)
  __onSdpRef.current = onSdp

  // keep a stable reference to the external RTCP handler
  const __onRtcpRef = useRef(onRtcp)
  __onRtcpRef.current = onRtcp

  useEffect(() => {
    if (play && pipeline && !fetching) {
      pipeline.ready
        .then(() => {
          pipeline.onSdp = (sdp) => {
            const videoMedia = sdp.media.find((m): m is VideoMedia => {
              return m.type === 'video'
            })
            if (videoMedia !== undefined) {
              __sensorTmRef.current = videoMedia['x-sensor-transform']
                ?? videoMedia['transform']
            }
            if (__onSdpRef.current !== undefined) {
              __onSdpRef.current(sdp)
            }
          }

          pipeline.rtsp.onRtcp = (rtcp) => {
            __onRtcpRef.current?.(rtcp)

            if (isRtcpBye(rtcp)) {
              __onEndedRef.current?.()
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
