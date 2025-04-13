import React, {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Container, Layer } from './Container'
import {
  PlaybackArea,
  PlayerNativeElement,
  VapixParameters,
  VideoProperties,
} from './PlaybackArea'
import { Pause, Play } from './components'
import { Limiter } from './components/Limiter'
import { useUserActive } from './hooks/useUserActive'
import { Format } from './types'

const DEFAULT_FORMAT = Format.JPEG

const controlAreaStyle = {
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'sans',
  height: '100%',
  justifyContent: 'flex-end',
  transition: 'opacity 0.3s ease-in-out',
  width: '100%',
} as const

const controlBarStyle = {
  width: '100%',
  height: '32px',
  background: 'rgb(0, 0, 0, 0.66)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  boxSizing: 'border-box',
} as const

interface BasicPlayerProps {
  readonly hostname: string
  readonly vapixParams?: VapixParameters
  readonly format?: Format
  readonly autoPlay?: boolean
  /**
   * Set to true if the camera requires a secure
   * connection, "https" and "wss" protocols.
   */
  readonly secure?: boolean
  readonly className?: string
  /**
   * Activate automatic retries on RTSP errors.
   */
  readonly autoRetry?: boolean
}

export const BasicPlayer = forwardRef<PlayerNativeElement, BasicPlayerProps>(
  (
    {
      hostname,
      vapixParams = {},
      format = DEFAULT_FORMAT,
      autoPlay = false,
      autoRetry = false,
      secure,
      className,
    },
    ref
  ) => {
    const [play, setPlay] = useState(autoPlay)
    const [host, setHost] = useState(hostname)

    /**
     * Controls
     */
    const [videoProperties, setVideoProperties] = useState<VideoProperties>()

    const onPlaying = useCallback(
      (props: VideoProperties) => {
        setVideoProperties(props)
      },
      [setVideoProperties]
    )

    const onPlayPause = useCallback(() => {
      if (play) {
        setPlay(false)
      } else {
        setHost(hostname)
        setPlay(true)
      }
    }, [play, hostname])

    useEffect(() => {
      const cb = () => {
        if (document.visibilityState === 'visible') {
          setPlay(true)
          setHost(hostname)
        } else if (document.visibilityState === 'hidden') {
          setPlay(false)
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

    const controlArea = useRef<HTMLDivElement>(null)
    const userActive = useUserActive(controlArea)

    /**
     * Render
     *
     * Each layer is positioned exactly on top of the visible image, since the
     * aspect ratio is carried over to the container, and the layers match the
     * container size.
     */

    const visible = play !== true || userActive

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
                refresh={0}
                play={play}
                host={host}
                format={format}
                parameters={vapixParams}
                onPlaying={onPlaying}
                secure={secure}
                autoRetry={autoRetry}
              />
            </Layer>
            <Layer>
              <div
                style={{ ...controlAreaStyle, opacity: visible ? 1 : 0 }}
                ref={controlArea}
              >
                <div style={controlBarStyle}>
                  {play === true ? (
                    <Pause onClick={onPlayPause} title="Pause" />
                  ) : (
                    <Play onClick={onPlayPause} title="Play" />
                  )}
                </div>
              </div>
            </Layer>
          </Container>
        </Limiter>
      </div>
    )
  }
)

BasicPlayer.displayName = 'BasicPlayer'
