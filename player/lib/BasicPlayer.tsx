import React, {
  useState,
  forwardRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  useRef,
} from 'react'

import { Container, Layer } from './Container'
import {
  PlaybackArea,
  AXIS_MEDIA_AMP,
  AXIS_IMAGE_CGI,
  VapixParameters,
  VideoProperties,
} from './PlaybackArea'
import { ControlArea, ControlBar } from './Controls'
import { Button } from './components/Button'
import { Pause, Play } from './img'
import { useUserActive } from './hooks/useUserActive'
import { Format, PlayerNativeElement } from './utils'
import { MediaStreamPlayerContainer } from './components/MediaStreamPlayerContainer'
import { Limiter } from './components/Limiter'

const DEFAULT_API_TYPE = AXIS_IMAGE_CGI

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
}

export const BasicPlayer = forwardRef<PlayerNativeElement, BasicPlayerProps>(
  (
    { hostname, vapixParams = {}, format, autoPlay = false, secure, className },
    ref,
  ) => {
    const [play, setPlay] = useState(autoPlay)
    const [refresh, setRefresh] = useState(0)
    const [host, setHost] = useState(hostname)
    const [api, setApi] = useState<string>(DEFAULT_API_TYPE)

    /**
     * VAPIX parameters
     */
    const [parameters, setParameters] = useState(vapixParams)

    /**
     * Controls
     */
    const [videoProperties, setVideoProperties] = useState<VideoProperties>()

    const onPlaying = useCallback(
      (props: VideoProperties) => {
        setVideoProperties(props)
      },
      [setVideoProperties],
    )

    const onPlayPause = useCallback(() => {
      if (play) {
        setPlay(false)
      } else {
        setHost(hostname)
        setPlay(true)
      }
    }, [play, hostname])

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

    const controlArea = useRef(null)
    const userActive = useUserActive(controlArea)

    /**
     * Render
     *
     * Each layer is positioned exactly on top of the visible image, since the
     * aspect ratio is carried over to the container, and the layers match the
     * container size.
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
                secure={secure}
              />
            </Layer>
            <Layer>
              <ControlArea
                ref={controlArea}
                visible={play !== true || userActive}
              >
                <ControlBar>
                  <Button onClick={onPlayPause}>
                    {play === true ? (
                      <Pause title="Pause" />
                    ) : (
                      <Play title="Play" />
                    )}
                  </Button>
                </ControlBar>
              </ControlArea>
            </Layer>
          </Container>
        </Limiter>
      </MediaStreamPlayerContainer>
    )
  },
)

BasicPlayer.displayName = 'BasicPlayer'
