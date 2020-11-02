import React, {
  useState,
  forwardRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  useRef,
} from 'react'
import styled from 'styled-components'
import { Sdp } from 'media-stream-library/dist/esm/utils/protocols'

import { Container, Layer } from './Container'
import {
  PlaybackArea,
  AXIS_MEDIA_AMP,
  AXIS_IMAGE_CGI,
  VapixParameters,
  VideoProperties,
} from './PlaybackArea'
import { Controls } from './Controls'
import { Feedback } from './Feedback'
import { Stats } from './Stats'
import { useSwitch } from './hooks/useSwitch'
import { getImageURL } from './utils'
import { MetadataHandler } from './metadata'

const DEFAULT_API_TYPE = AXIS_IMAGE_CGI

/**
 * Wrapper for the entire player that will take up all available place from the
 * parent.
 */
const MediaStreamPlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

/**
 * The limiter prevents the video element to use up all of the available width.
 * The player container will automatically limit it's own height based on the
 * available width (keeping aspect ratio).
 */
const Limiter = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

interface PlayerProps {
  readonly hostname: string
  readonly vapixParams?: VapixParameters
  readonly format?: Format
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
}

export type PlayerNativeElement =
  | HTMLVideoElement
  | HTMLCanvasElement
  | HTMLImageElement

export type Format = 'H264' | 'MJPEG' | 'JPEG'

export const FORMAT_API = {
  H264: AXIS_MEDIA_AMP,
  MJPEG: AXIS_MEDIA_AMP,
  JPEG: AXIS_IMAGE_CGI,
}

export const Player = forwardRef<PlayerNativeElement, PlayerProps>(
  (
    {
      hostname,
      vapixParams = {},
      format,
      autoPlay = false,
      onSdp,
      metadataHandler,
      secure,
      className,
    },
    ref,
  ) => {
    const [play, setPlay] = useState(autoPlay)
    const [refresh, setRefresh] = useState(0)
    const [host, setHost] = useState(hostname)
    const [waiting, setWaiting] = useState(autoPlay)
    const [api, setApi] = useState<string>(DEFAULT_API_TYPE)
    const [volume, setVolume] = useState<number>()

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
        : false,
    )

    useEffect(() => {
      if (window?.localStorage !== undefined) {
        window.localStorage.setItem(
          'stats-overlay',
          showStatsOverlay ? 'on' : 'off',
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
      [setWaiting],
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

    const onFormat = useCallback((newFormat: Format | undefined) => {
      switch (newFormat) {
        case 'H264':
          setApi(AXIS_MEDIA_AMP)
          setParameters((prevParams) => ({ ...prevParams, videocodec: 'h264' }))
          break
        case 'MJPEG':
          setApi(AXIS_MEDIA_AMP)
          setParameters((prevParams) => ({ ...prevParams, videocodec: 'jpeg' }))
          break
        case 'JPEG':
        default:
          setApi(AXIS_IMAGE_CGI)
          break
      }
      setRefresh((value) => value + 1)
    }, [])

    useEffect(() => {
      onFormat(format)
    }, [format, onFormat])

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
      <MediaStreamPlayerContainer className={className}>
        <Limiter ref={limiterRef}>
          <Container aspectRatio={naturalAspectRatio}>
            <Layer>
              <PlaybackArea
                forwardedRef={ref}
                refresh={refresh}
                play={play}
                host={host}
                api={api}
                parameters={parameters}
                onPlaying={onPlaying}
                onSdp={onSdp}
                metadataHandler={metadataHandler}
                secure={secure}
              />
            </Layer>
            <Layer>
              <Feedback waiting={waiting} />
            </Layer>
            <Layer>
              <Controls
                play={play}
                src={host}
                parameters={parameters}
                onPlay={onPlayPause}
                onStop={onStop}
                onRefresh={onRefresh}
                onScreenshot={onScreenshot}
                onFormat={onFormat}
                onVapix={onVapix}
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
                api={api}
                volume={volume}
                setVolume={setVolume}
              />
            </Layer>
            {showStatsOverlay && videoProperties !== undefined ? (
              <Stats
                api={api}
                parameters={parameters}
                videoProperties={videoProperties}
                refresh={refresh}
                volume={volume}
              />
            ) : null}
          </Container>
        </Limiter>
      </MediaStreamPlayerContainer>
    )
  },
)

Player.displayName = 'Player'
