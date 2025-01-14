import React, {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Sdp } from '../streams'

import { Container, Layer } from './Container'
import { Controls } from './Controls'
import { Feedback } from './Feedback'
import {
  PlaybackArea,
  PlayerNativeElement,
  VapixParameters,
  VideoProperties,
} from './PlaybackArea'
import { Stats } from './Stats'
import { Limiter } from './components/Limiter'
import { useSwitch } from './hooks/useSwitch'
import { MetadataHandler } from './metadata'
import { Format } from './types'
import { getImageURL } from './utils'

const DEFAULT_FORMAT = Format.JPEG

interface PlayerProps {
  readonly hostname: string
  readonly vapixParams?: VapixParameters
  readonly initialFormat?: Format
  readonly autoPlay?: boolean
  readonly onSdp?: (msg: Sdp) => void
  readonly metadataHandler?: MetadataHandler
  /**
   * Set to true if the camera requires a secure
   * connection, "https" and "wss" protocols.
   */
  readonly secure?: boolean
  readonly aspectRatio?: number
  readonly className?: string
  /**
   * When playing a recording, the time the video started
   * (used for labeling with an absolute time) formatted
   * as an ISO time, e.g.: 2021-02-03T12:21:57.465715Z
   */
  readonly startTime?: string
  /**
   * When playing a recording, the total duration of the video
   * if known by the user (and not reported from backend) in
   * seconds.
   */
  readonly duration?: number

  /**
   * Activate automatic retries on RTSP errors.
   */
  readonly autoRetry?: boolean
}

export const Player = forwardRef<PlayerNativeElement, PlayerProps>(
  (
    {
      hostname,
      vapixParams = {},
      initialFormat = DEFAULT_FORMAT,
      autoPlay = false,
      onSdp,
      metadataHandler,
      secure,
      className,
      startTime,
      duration,
      autoRetry = false,
    },
    ref
  ) => {
    const [play, setPlay] = useState(autoPlay)
    const [offset, setOffset] = useState(0)
    const [refresh, setRefresh] = useState(0)
    const [host, setHost] = useState(hostname)
    const [waiting, setWaiting] = useState(autoPlay)
    const [volume, setVolume] = useState<number>()
    const [format, setFormat] = useState<Format>(initialFormat)

    /**
     * VAPIX parameters
     */
    const [parameters, setParameters] = useState(vapixParams)

    useEffect(() => {
      /**
       * Check if localStorage actually exists, since if you
       * server side render, localStorage won't be available.
       */
      if (window?.localStorage !== undefined) {
        window.localStorage.setItem('vapix', JSON.stringify(parameters))
      }
    }, [parameters])

    /**
     * Stats overlay
     */
    const [showStatsOverlay, toggleStatsOverlay] = useSwitch(
      window?.localStorage !== undefined
        ? window.localStorage.getItem('stats-overlay') === 'on'
        : false
    )

    useEffect(() => {
      if (window?.localStorage !== undefined) {
        window.localStorage.setItem(
          'stats-overlay',
          showStatsOverlay ? 'on' : 'off'
        )
      }
    }, [showStatsOverlay])

    /**
     * Controls
     */
    const [videoProperties, setVideoProperties] = useState<VideoProperties>()

    const onPlaying = useCallback(
      (props: VideoProperties) => {
        setVideoProperties(props)
        setWaiting(false)
        setVolume(props.volume)
      },
      [setWaiting]
    )

    const onPlayPause = useCallback(() => {
      if (play) {
        setPlay(false)
      } else {
        setWaiting(true)
        setHost(hostname)
        setPlay(true)
      }
    }, [play, hostname])

    const onRefresh = useCallback(() => {
      setPlay(true)
      setRefresh((value) => value + 1)
      setWaiting(true)
    }, [])

    const onScreenshot = useCallback(() => {
      if (videoProperties === undefined) {
        return undefined
      }

      const { el, width, height } = videoProperties
      const imageURL = getImageURL(el, { width, height })
      const link = document.createElement('a')
      const event = new window.MouseEvent('click')

      link.download = `snapshot_${Date.now()}.jpg`
      link.href = imageURL
      link.dispatchEvent(event)
    }, [videoProperties])

    const onStop = useCallback(() => {
      setPlay(false)
      setHost('')
      setWaiting(false)
    }, [])

    const onVapix = useCallback((key: string, value: string) => {
      setParameters((p: typeof vapixParams) => {
        const newParams = { ...p, [key]: value }
        if (value === '') {
          delete newParams[key]
        }
        return newParams
      })
      setRefresh((refreshCount) => refreshCount + 1)
    }, [])

    /**
     * Refresh when changing visibility (e.g. when you leave a tab the
     * video will halt, so when you return we need to play again).
     */
    useEffect(() => {
      const cb = () => {
        if (document.visibilityState === 'visible') {
          setPlay(true)
          setHost(hostname)
        } else if (document.visibilityState === 'hidden') {
          setPlay(false)
          setWaiting(false)
          setHost('')
        }
      }

      document.addEventListener('visibilitychange', cb)

      return () => document.removeEventListener('visibilitychange', cb)
    }, [hostname])

    /**
     * Aspect ratio
     *
     * This needs to be set so make the Container (and Layers) match the size of
     * the visible image of the video or still image.
     */

    const naturalAspectRatio = useMemo(() => {
      if (videoProperties === undefined) {
        return undefined
      }

      const { width, height } = videoProperties

      return width / height
    }, [videoProperties])

    /**
     * Limit video size.
     *
     * The video size should not expand outside the available container, and
     * should be recomputed on resize.
     */

    const limiterRef = useRef<HTMLDivElement>(null)
    useLayoutEffect(() => {
      if (naturalAspectRatio === undefined || limiterRef.current === null) {
        return
      }

      const observer = new window.ResizeObserver(([entry]) => {
        const element = entry.target as HTMLElement
        const maxWidth = element.clientHeight * naturalAspectRatio
        element.style.maxWidth = `${maxWidth}px`
      })
      observer.observe(limiterRef.current)

      return () => observer.disconnect()
    }, [naturalAspectRatio])

    /**
     * Volume control on the VideoElement (h264 only)
     */
    useEffect(() => {
      if (videoProperties?.volume !== undefined && volume !== undefined) {
        const videoEl = videoProperties.el as HTMLVideoElement
        videoEl.muted = volume === 0
        videoEl.volume = volume
      }
    }, [videoProperties, volume])

    /**
     * Refresh on stream end
     */
    const onEnded = useCallback(() => {
      if (autoRetry) {
        onRefresh()
      }
    }, [autoRetry, onRefresh])

    /**
     * Render
     *
     * Each layer is positioned exactly on top of the visible image, since the
     * aspect ratio is carried over to the container, and the layers match the
     * container size.
     *
     * There is a layer for the spinner (feedback), a statistics overlay, and a
     * control bar with play/pause/stop/refresh and a settings menu.
     */

    return (
      <div
        style={{ position: 'relative', width: '100%', height: '100%' }}
        className={className}
      >
        <Limiter ref={limiterRef}>
          <Container aspectRatio={naturalAspectRatio}>
            <Layer>
              <PlaybackArea
                forwardedRef={ref}
                refresh={refresh}
                play={play}
                offset={offset}
                host={host}
                format={format}
                parameters={parameters}
                onPlaying={onPlaying}
                onEnded={onEnded}
                onSdp={onSdp}
                metadataHandler={metadataHandler}
                secure={secure}
                autoRetry={autoRetry}
              />
            </Layer>
            <Layer>
              <Feedback waiting={waiting} />
            </Layer>
            <Layer>
              <Controls
                play={play}
                videoProperties={videoProperties}
                src={host}
                parameters={parameters}
                onPlay={onPlayPause}
                onStop={onStop}
                onRefresh={onRefresh}
                onScreenshot={onScreenshot}
                onFormat={setFormat}
                onVapix={onVapix}
                onSeek={setOffset}
                labels={{
                  play: 'Play',
                  pause: 'Pause',
                  stop: 'Stop',
                  refresh: 'Refresh',
                  settings: 'Settings',
                  screenshot: 'Take a snapshot',
                  volume: 'Volume',
                }}
                showStatsOverlay={showStatsOverlay}
                toggleStats={toggleStatsOverlay}
                format={format}
                volume={volume}
                setVolume={setVolume}
                startTime={startTime}
                duration={duration}
              />
            </Layer>
            {showStatsOverlay && videoProperties !== undefined ? (
              <Stats
                format={format}
                videoProperties={videoProperties}
                refresh={refresh}
                volume={volume}
              />
            ) : null}
          </Container>
        </Limiter>
      </div>
    )
  }
)

Player.displayName = 'Player'
