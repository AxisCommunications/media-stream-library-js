import React, { useRef, useEffect } from 'react'
import styled from 'styled-components'

import debug from 'debug'

import { useEventState } from './hooks/useEventState'
import { VideoProperties } from './PlaybackArea'

const debugLog = debug('msp:still-image')

const ImageNative = styled.img`
  max-height: 100%;
  object-fit: contain;
  width: 100%;
`

interface StillImageProps {
  readonly forwardedRef?: React.Ref<HTMLImageElement>
  readonly play?: boolean
  readonly src?: string
  readonly onPlaying: (props: VideoProperties) => void
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

export const StillImage: React.FC<StillImageProps> = ({
  forwardedRef,
  play = false,
  onPlaying,
  src,
}) => {
  let imgRef = useRef<HTMLImageElement>(null)

  // Forwarded refs can either be a callback or the result of useRef
  if (typeof forwardedRef === 'function') {
    forwardedRef(imgRef.current)
  } else if (forwardedRef) {
    imgRef = forwardedRef
  }

  // State tied to events
  const [loaded, unsetLoaded] = useEventState(imgRef, 'load')

  useEffect(() => {
    if (imgRef.current !== null) {
      if (play && src !== undefined) {
        imgRef.current.src = src
      } else {
        imgRef.current.src = ''
        unsetLoaded()
      }
    }
  }, [play, src, unsetLoaded])

  // keep a stable reference to the external onPlaying callback
  const __onPlayingRef = useRef(onPlaying)
  __onPlayingRef.current = onPlaying

  useEffect(() => {
    const el = imgRef.current
    if (loaded && el !== null && __onPlayingRef.current !== undefined) {
      __onPlayingRef.current({
        el,
        width: el.naturalWidth,
        height: el.naturalHeight,
      })
    }
  }, [loaded])

  debugLog('render image', loaded)
  return <ImageNative ref={imgRef} />
}
