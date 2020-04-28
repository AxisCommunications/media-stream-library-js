import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'

import debug from 'debug'

import { pipelines } from 'media-stream-library/dist/esm/index.browser'
import { VideoProperties } from './PlaybackArea'

const debugLog = debug('msp:ws-rtsp-video')

const CanvasNative = styled.canvas`
  max-height: 100%;
  object-fit: contain;
  width: 100%;
`

interface WsRtspCanvasProps {
  forwardedRef?: React.Ref<HTMLCanvasElement>
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
   * Callback to signal video is playing.
   */
  onPlaying: (props: VideoProperties) => void
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
}) => {
  let canvasRef = useRef<HTMLCanvasElement>(null)

  // Forwarded refs can either be a callback or the result of useRef
  if (typeof forwardedRef === 'function') {
    forwardedRef(canvasRef.current)
  } else if (forwardedRef) {
    canvasRef = forwardedRef
  }

  // State tied to resources
  const [
    pipeline,
    setPipeline,
  ] = useState<null | pipelines.Html5CanvasPipeline>(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (ws && rtsp && canvas) {
      debugLog('create pipeline')
      const pipeline = new pipelines.Html5CanvasPipeline({
        ws: { uri: ws },
        rtsp: { uri: rtsp },
        mediaElement: canvas,
      })
      setPipeline(pipeline)

      return () => {
        debugLog('destroy pipeline')
        pipeline.pause()
        pipeline.close()
        setPipeline(null)
        setFetching(false)
        debugLog('canvas cleared')
      }
    }
  }, [ws, rtsp])

  useEffect(() => {
    if (play && pipeline && !fetching) {
      pipeline.ready.then(() => {
        debugLog('fetch')
        pipeline.rtsp.play()
        setFetching(true)
      })
    } else if (play && pipeline !== null) {
      debugLog('play')
      pipeline.play()

      // Callback `onCanPlay` is called when the canvas element is ready to
      // play. We need to wait for that event to get the correct width/height.
      pipeline.onCanplay = () => {
        if (canvasRef.current !== null) {
          onPlaying({
            el: canvasRef.current,
            width: canvasRef.current.width,
            height: canvasRef.current.height,
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
