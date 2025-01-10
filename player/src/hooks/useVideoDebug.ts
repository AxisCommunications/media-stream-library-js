import { useEffect } from 'react'

import { logDebug } from '../utils/log'

/**
 * Show debug logs with information received from
 * 'progress' & 'timeupdate' events including the current
 * up time, delay and end time of last buffer.
 * bufferedEnd: the last buffered time
 * currentTime: current playback time
 * delay: the last buffered time - current playback time
 */
export const useVideoDebug = (videoEl: HTMLVideoElement | null) => {
  useEffect(() => {
    if (videoEl === null) {
      return
    }

    // Hacky way of showing delay as a video overlay (don't copy this)
    // but it prevents the console from overflowing with buffer statements
    const stats = document.createElement('div')
    const text = document.createElement('pre')
    stats.appendChild(text)
    videoEl.parentElement?.appendChild(stats)
    stats.setAttribute(
      'style',
      'background: rgba(120,255,100,0.4); position: absolute; width: 100px; height: 16px; top: 0; left: 0; font-size: 11px; font-family: "sans";'
    )
    text.setAttribute('style', 'margin: 2px;')

    const onUpdate = () => {
      try {
        const currentTime = videoEl.currentTime
        const bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1)

        const delay = Math.floor((bufferedEnd - currentTime) * 1000)
        const contents = `buffer: ${String(delay).padStart(4, ' ')}ms`
        text.innerText = contents
      } catch (err) {
        logDebug(err)
      }
    }

    videoEl.addEventListener('timeupdate', onUpdate)
    videoEl.addEventListener('progress', onUpdate)

    return () => {
      videoEl.removeEventListener('timeupdate', onUpdate)
      videoEl.removeEventListener('progress', onUpdate)
      stats.remove()
    }
  }, [videoEl])
}
