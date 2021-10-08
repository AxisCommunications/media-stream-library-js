import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'

import debug from 'debug'

import {
  Sdp,
  pipelines,
  utils,
  VideoMedia,
  TransformationMatrix,
} from 'media-stream-library'
import { VideoProperties, Range } from './PlaybackArea'
import { FORMAT_SUPPORTS_AUDIO } from './constants'
import { Format } from './types'

const debugLog = debug('msp:ws-rtsp-video')

const CanvasNative = styled.canvas`
  max-height: 100%;
  object-fit: contain;
  width: 100%;
`

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
  /**
   * The RTSP URI.
   */
  readonly rtsp?: string
  /**
   * Callback to signal video is playing.
   */
  readonly onPlaying: (props: VideoProperties) => void
  /**
   * Callback when SDP data is received.
   */
  readonly onSdp?: (msg: Sdp) => void
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
  ws = '',
  rtsp = '',
  onPlaying,
  onSdp,
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
  const [pipeline, setPipeline] =
    useState<null | pipelines.Html5CanvasPipeline>(null)
  const [fetching, setFetching] = useState(false)

  // keep track of changes in starting time
  // (offset in seconds to start playing from)
  const __offsetRef = useRef(offset)
  const __rangeRef = useRef<Range>([offset, undefined])

  useEffect(() => {
    __offsetRef.current = offset
    const canvas = canvasRef.current
    if (ws && rtsp && canvas) {
      debugLog('create pipeline')
      const newPipeline = new pipelines.Html5CanvasPipeline({
        ws: { uri: ws },
        rtsp: { uri: rtsp },
        mediaElement: canvas,
      })
      if (autoRetry) {
        utils.addRTSPRetry(newPipeline.rtsp)
      }
      setPipeline(newPipeline)

      return () => {
        debugLog('destroy pipeline')
        newPipeline.pause()
        newPipeline.close()
        setPipeline(null)
        setFetching(false)
        debugLog('canvas cleared')
      }
    }
  }, [ws, rtsp, offset, autoRetry])

  // keep a stable reference to the external onPlaying callback
  const __onPlayingRef = useRef(onPlaying)
  __onPlayingRef.current = onPlaying

  // keep a stable reference to the external SDP handler
  const __onSdpRef = useRef(onSdp)
  __onSdpRef.current = onSdp

  const __sensorTmRef = useRef<TransformationMatrix>()

  useEffect(() => {
    if (play && pipeline && !fetching) {
      pipeline.ready
        .then(() => {
          debugLog('fetch')
          pipeline.onSdp = (sdp) => {
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
          setFetching(true)
        })
        .catch(console.error)
    } else if (play && pipeline !== null) {
      debugLog('play')
      pipeline.play()

      // Callback `onCanPlay` is called when the canvas element is ready to
      // play. We need to wait for that event to get the correct width/height.
      pipeline.onCanplay = () => {
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
      }
    } else if (!play && pipeline) {
      debugLog('pause')
      pipeline.pause()
    }
  }, [play, pipeline, fetching])

  return <CanvasNative ref={canvasRef} />
}
