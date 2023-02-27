import { useEffect } from 'react'

import { Debugger } from 'debug'

/**
 * Show debug logs with information received from
 * 'progress' & 'timeupdate' events including the current
 * up time, delay and end time of last buffer.
 * bufferedEnd: the last buffered time
 * currentTime: current playback time
 * delay: the last buffered time - current playback time
 */
export const useVideoDebug = (
  videoEl: HTMLVideoElement | null,
  debugLog: Debugger
) => {
  useEffect(() => {
    if (videoEl === null) {
      return
    }

    const onUpdate = () => {
      try {
        const currentTime = videoEl.currentTime
        const bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1)

        debugLog('%o', {
          delay: bufferedEnd - currentTime,
          currentTime,
          bufferedEnd,
        })
      } catch (err) {
        debugLog('%o', err)
      }
    }

    videoEl.addEventListener('timeupdate', onUpdate)
    videoEl.addEventListener('progress', onUpdate)

    return () => {
      videoEl.removeEventListener('timeupdate', onUpdate)
      videoEl.removeEventListener('progress', onUpdate)
    }
  }, [debugLog, videoEl])
}
