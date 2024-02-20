import React, { Ref, useEffect, useRef } from 'react'

import debug from 'debug'
import styled from 'styled-components'

import { FORMAT_SUPPORTS_AUDIO } from './constants'
import { useEventState } from './hooks/useEventState'
import { VapixParameters, VideoProperties } from './PlaybackArea'
import { Format } from './types'
import { Session } from './webrtc/Session'
import { Authenticator } from './webrtc/types'
import { vapixParameterToVideoReceive } from './webrtc/vapixParameterToVideoReceive'

const debugLog = debug('msp:webrtc-video')

const VideoNative = styled.video`
  max-height: 100%;
  object-fit: contain;
  width: 100%;
`

export interface SignalingOptions {
  readonly authenticator: Authenticator
  readonly env: 'stage' | 'prod'
  readonly organizationArn: string
  readonly serial: string
}

interface WebRtcVideoProps {
  readonly forwardedRef?: Ref<HTMLVideoElement>
  /**
   * The _intended_ playback state.
   */
  readonly play?: boolean

  /**
   * WebRTC options
   */
  readonly signalingOptions: SignalingOptions

  readonly parameters: VapixParameters

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
}

export const WebRtcVideo: React.FC<WebRtcVideoProps> = ({
  forwardedRef,
  muted,
  autoPlay,
  onPlaying,
  play,
  signalingOptions,
  parameters,
}: WebRtcVideoProps) => {
  let videoRef = useRef<HTMLVideoElement>(null)

  // Forwarded refs can either be a callback or the result of useRef
  if (typeof forwardedRef === 'function') {
    forwardedRef(videoRef.current)
  } else if (forwardedRef) {
    videoRef = forwardedRef
  }

  // keep a stable reference to the external onPlaying callback
  const __onPlayingRef = useRef(onPlaying)
  __onPlayingRef.current = onPlaying

  /**
   * Internal state:
   * -> canplay: there is enough data on the video element to play.
   * -> playing: the video element playback is progressing.
   */
  const [canplay, unsetCanplay] = useEventState(videoRef, 'canplay')
  const [playing, unsetPlaying] = useEventState(videoRef, 'playing')

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

      const { videoHeight, videoWidth } = videoEl
      debugLog('%o', {
        videoHeight,
        videoWidth,
      })
    } else if (!play && playing) {
      debugLog('pause')
      videoEl.pause()
      unsetPlaying()
    } else if (play && playing) {
      if (__onPlayingRef.current !== undefined) {
        __onPlayingRef.current({
          el: videoEl,
          width: videoEl.videoWidth,
          height: videoEl.videoHeight,
          formatSupportsAudio: FORMAT_SUPPORTS_AUDIO[Format.WEBRTC],
          volume: videoEl.volume,
        })
      }
    }
  }, [play, canplay, playing, unsetPlaying])

  useEffect(() => {
    const node = videoRef.current
    const params = vapixParameterToVideoReceive(parameters)

    const session = new Session(
      signalingOptions.authenticator,
      signalingOptions.organizationArn,
      signalingOptions.serial,
      params,
      {
        onTrack(streams) {
          if (node !== null) {
            node.srcObject = streams[0]
          }
        },
      },
      signalingOptions.env
    )

    session.init()

    return () => {
      session.close()
      if (node !== null) {
        node.src = ''
      }
      unsetCanplay()
      unsetPlaying()
    }
  }, [parameters, signalingOptions, unsetCanplay, unsetPlaying])

  return <VideoNative autoPlay={autoPlay} muted={muted} ref={videoRef} />
}
