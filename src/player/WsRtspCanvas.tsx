import React, { useEffect, useRef, useState } from 'react'

import {
  Rtcp,
  RtspJpegPipeline,
  Sdp,
  TransformationMatrix,
  VideoMedia,
  isRtcpBye,
} from '../streams'

import { Range, VideoProperties } from './PlaybackArea'
import { FORMAT_SUPPORTS_AUDIO } from './constants'
import { Format } from './types'
import { logDebug } from './utils/log'

interface WsRtspCanvasProps {
  readonly forwardedRef?: React.Ref<HTMLCanvasElement>
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
   * Callback to signal video is playing.
   */
  readonly onPlaying: (props: VideoProperties) => void
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
  /**
   * Start playing from a specific offset (in seconds)
   */
  readonly offset?: number

  /**
   * Activate automatic retries on RTSP errors.
   */
  readonly autoRetry?: boolean
}

/**
 * Properties:
 *
 * play: indicated the _intended_ playback state
 * ws/rtsp: src URIs for WebSocket/RTP server
 *
 * Internal state:
 * canplay: there is enough data on the video element to play
 * playing: the video element playback is progressing
 */

export const WsRtspCanvas: React.FC<WsRtspCanvasProps> = ({
  forwardedRef,
  play = true,
  ws,
  token,
  rtsp,
  onPlaying,
  onEnded,
  onSdp,
  onRtcp,
  offset = 0,
  autoRetry = false,
}) => {
  let canvasRef = useRef<HTMLCanvasElement>(null)

  // Forwarded refs can either be a callback or the result of useRef
  if (typeof forwardedRef === 'function') {
    forwardedRef(canvasRef.current)
  } else if (forwardedRef) {
    canvasRef = forwardedRef
  }

  // State tied to resources
  const [pipeline, setPipeline] = useState<null | RtspJpegPipeline>(null)
  const [fetching, setFetching] = useState(false)

  // keep track of changes in starting time
  // (offset in seconds to start playing from)
  const __offsetRef = useRef(offset)
  const __rangeRef = useRef<Range>([offset, undefined])

  /**
   * Show debug log for current time.
   * currentTime: current playback time
   */
  const timeout = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (pipeline === null) {
      return
    }

    timeout.current = window.setInterval(() => {
      const { currentTime } = pipeline
      logDebug(`currentTime: ${currentTime}`)
    }, 1000)

    return () => window.clearTimeout(timeout.current)
  }, [pipeline])

  useEffect(() => {
    __offsetRef.current = offset
    const canvas = canvasRef.current
    if (ws && rtsp && canvas) {
      logDebug('create pipeline', ws, rtsp)
      const newPipeline = new RtspJpegPipeline({
        ws: { uri: ws, tokenUri: token },
        rtsp: { uri: rtsp },
        mediaElement: canvas,
      })
      if (autoRetry) {
        newPipeline.rtsp.retry.codes = [503]
      }
      setPipeline(newPipeline)

      return () => {
        logDebug('destroy pipeline')
        newPipeline.pause()
        newPipeline.close()
        setPipeline(null)
        setFetching(false)
        logDebug('canvas cleared')
      }
    }
  }, [ws, rtsp, offset, autoRetry])

  // keep a stable reference to the external onPlaying callback
  const __onPlayingRef = useRef(onPlaying)
  __onPlayingRef.current = onPlaying

  // keep a stable reference to the external onEnded callback
  const __onEndedRef = useRef(onEnded)
  __onEndedRef.current = onEnded

  // keep a stable reference to the external SDP handler
  const __onSdpRef = useRef(onSdp)
  __onSdpRef.current = onSdp

  // keep a stable reference to the external RTCP handler
  const __onRtcpRef = useRef(onRtcp)
  __onRtcpRef.current = onRtcp

  const __sensorTmRef = useRef<TransformationMatrix>(undefined)

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
      logDebug('fetching')
      setFetching(true)
    } else if (play && pipeline !== null) {
      logDebug('play')
      // Play only starts when the canvas element is ready to play.
      /// We need to await that to get the correct width/height.
      pipeline.play().then(() => {
        if (
          canvasRef.current !== null &&
          __onPlayingRef.current !== undefined
        ) {
          __onPlayingRef.current({
            el: canvasRef.current,
            width: canvasRef.current.width,
            height: canvasRef.current.height,
            formatSupportsAudio: FORMAT_SUPPORTS_AUDIO[Format.RTP_JPEG],
            range: __rangeRef.current,
            sensorTm: __sensorTmRef.current,
          })
        }
      })
    } else if (!play && pipeline) {
      logDebug('pause')
      pipeline.pause()
    }
  }, [play, pipeline, fetching])

  return (
    <canvas
      style={{ maxHeight: '100%', objectFit: 'contain', width: '100%' }}
      ref={canvasRef}
    />
  )
}
