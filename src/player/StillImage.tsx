import React, { useEffect, useRef } from 'react'

import { VideoProperties } from './PlaybackArea'
import { FORMAT_SUPPORTS_AUDIO } from './constants'
import { useEventState } from './hooks/useEventState'
import { Format } from './types'
import { logDebug } from './utils/log'

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
 *
 * Internal state:
 * canplay: there is enough data on the video element to play
 * playing: the video element playback is progressing
 */

let cachebust = 0
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
    const imgEl = imgRef.current
    if (imgEl === null) {
      return
    }
    if (play && src !== undefined) {
      imgEl.src = `${src}&cachebust=${cachebust++}`
      return () => {
        imgEl.src = ''
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
        formatSupportsAudio: FORMAT_SUPPORTS_AUDIO[Format.JPEG],
      })
    }
  }, [loaded])

  logDebug('render image', loaded)
  return (
    <img
      style={{ maxHeight: '100%', objectFit: 'contain', width: '100%' }}
      ref={imgRef}
    />
  )
}
