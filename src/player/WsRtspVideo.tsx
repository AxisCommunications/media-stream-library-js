import React, { useEffect, useRef, useState } from 'react'

import {
  Rtcp,
  RtspMp4Pipeline,
  Scheduler,
  Sdp,
  TransformationMatrix,
  VideoMedia,
  isRtcpBye,
} from '../streams'

import { Range, VideoProperties } from './PlaybackArea'
import { FORMAT_SUPPORTS_AUDIO } from './constants'
import { useEventState } from './hooks/useEventState'
import {
  MetadataHandler,
  ScheduledMessage,
  attachMetadataHandler,
} from './metadata'
import { Format } from './types'
import { logDebug } from './utils/log'

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
  readonly token?: string
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
  token,
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
  const [pipeline, setPipeline] = useState<null | RtspMp4Pipeline>(null)
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

  const __sensorTmRef = useRef<TransformationMatrix>(undefined)

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
          formatSupportsAudio: FORMAT_SUPPORTS_AUDIO[Format.RTP_H264],
          height: videoEl.videoHeight,
          media: pipeline?.mp4.tracks?.map(({ codec, name }) => ({
            codec,
            name,
          })),
          pipeline: pipeline ?? undefined,
          range: __rangeRef.current,
          sensorTm: __sensorTmRef.current,
          volume: pipeline?.mp4.tracks?.find((track) =>
            track.codec.startsWith('mp4a')
          )
            ? videoEl.volume
            : undefined,
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
    __offsetRef.current = offset

    if (
      ws !== undefined &&
      ws.length > 0 &&
      rtsp !== undefined &&
      rtsp.length > 0 &&
      videoEl !== null
    ) {
      logDebug('create pipeline', ws, rtsp)
      const newPipeline = new RtspMp4Pipeline({
        ws: { uri: ws, tokenUri: token },
        rtsp: { uri: rtsp },
        mediaElement: videoEl,
      })
      if (autoRetry) {
        newPipeline.rtsp.retry.codes = [503]
      }
      setPipeline(newPipeline)

      let scheduler: Scheduler<ScheduledMessage> | undefined
      if (__metadataHandlerRef.current !== undefined) {
        scheduler = attachMetadataHandler(
          newPipeline,
          __metadataHandlerRef.current
        )
      }

      return () => {
        logDebug('close pipeline and clear video')
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
      pipeline.rtsp.onRtcp = (rtcp) => {
        __onRtcpRef.current?.(rtcp)

        if (isRtcpBye(rtcp)) {
          __onEndedRef.current?.()
        }
      }

      pipeline
        .start(__offsetRef.current)
        .then(({ sdp, range }) => {
          const videoMedia = sdp.media.find((m): m is VideoMedia => {
            return m.type === 'video'
          })
          if (videoMedia !== undefined) {
            __sensorTmRef.current =
              videoMedia['x-sensor-transform'] ?? videoMedia['transform']
          }
          if (__onSdpRef.current !== undefined) {
            __onSdpRef.current(sdp)
          }
          if (range !== undefined) {
            __rangeRef.current = [
              parseFloat(range[0]) || 0,
              parseFloat(range[1]) || undefined,
            ]
          }
        })
        .catch((err) => console.log('failed to start pipeline:', err))
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
