import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import debug from 'debug'

import {
  MessageType,
  XmlMessage,
} from 'media-stream-library/dist/esm/components/message'
import { Sdp } from 'media-stream-library/dist/esm/utils/protocols'
import {
  pipelines,
  utils,
  components,
} from 'media-stream-library/dist/esm/index.browser'

import useEventState from './hooks/useEventState'
import { VideoProperties } from './PlaybackArea'

const debugLog = debug('msp:ws-rtsp-video')

const VideoNative = styled.video`
  max-height: 100%;
  object-fit: contain;
  width: 100%;
`

export interface MetadataMessage {
  ntpTimestamp: number
  xmlDocument: XMLDocument
}

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
  metadataHandler?: (msg: MetadataMessage) => void
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
      videoEl.play().catch(err => {
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

      if (metadataHandler) {
        /**
         * When a metadata handler is available on this component, it will be
         * called in sync with the player, using a scheduler to synchronize the
         * callback with the video presentation time.
         */
        const scheduler = new utils.Scheduler(pipeline, metadataHandler, 30)
        const xmlParser = new DOMParser()

        const xmlMessageHandler = (msg: XmlMessage) => {
          const xmlDocument = xmlParser.parseFromString(
            msg.data.toString(),
            'text/xml',
          )
          if (msg.ntpTimestamp) {
            scheduler.run({ ntpTimestamp: msg.ntpTimestamp, xmlDocument })
          }
        }

        // Add extra components to the pipeline.
        const onvifDepay = new components.ONVIFDepay()
        const onvifHandlerPipe = components.Tube.fromHandlers(msg => {
          if (msg.type === MessageType.XML) {
            xmlMessageHandler(msg)
          }
        }, undefined)
        pipeline.insertAfter(pipeline.rtsp, onvifDepay)
        pipeline.insertAfter(onvifDepay, onvifHandlerPipe)

        // Initialize the scheduler when presentation time is ready
        pipeline.onSync = (ntpPresentationTime: number) =>
          scheduler.init(ntpPresentationTime)
      }

      return () => {
        debugLog('destroy pipeline')
        pipeline.close()
        setPipeline(null)
        setFetching(false)
      }
    }
  }, [ws, rtsp])

  if (play && pipeline && !fetching) {
    pipeline.ready.then(() => {
      debugLog('fetch')
      pipeline.onSdp = onSdp
      pipeline.rtsp.play()
      setFetching(true)
    })
  }

  return <VideoNative autoPlay={autoPlay} muted={muted} ref={videoRef} />
}
