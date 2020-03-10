import React, { useState, forwardRef, Ref, useEffect, useCallback } from 'react'

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
import { Sdp } from 'media-stream-library/dist/esm/utils/protocols'
import { MetadataMessage } from './WsRtspVideo'

const DEFAULT_API_TYPE = AXIS_IMAGE_CGI

interface PlayerProps {
  hostname: string
  vapixParams?: VapixParameters
  format?: Format
  autoPlay?: boolean
  onSdp?: (msg: Sdp) => void
  metadataHandler?: (msg: MetadataMessage) => void
  aspectRatio?: number
}

export type RefType = Ref<
  HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
>

export type Format = 'H264' | 'MJPEG' | 'JPEG'

export const FORMAT_API = {
  H264: AXIS_MEDIA_AMP,
  MJPEG: AXIS_MEDIA_AMP,
  JPEG: AXIS_IMAGE_CGI,
}

export const Player: React.FC<PlayerProps> = forwardRef(
  (
    {
      hostname,
      vapixParams = {},
      format,
      autoPlay,
      onSdp,
      metadataHandler,
      aspectRatio,
    },
    ref: RefType
  ) => {
    const [play, setPlay] = useState(autoPlay || false)
    const [refresh, setRefresh] = useState(0)
    const [host, setHost] = useState(hostname)
    const [waiting, setWaiting] = useState(autoPlay)
    const [api, setApi] = useState(
      format ? FORMAT_API[format] : DEFAULT_API_TYPE
    )
    const [parameters, setParameters] = useState(vapixParams)
    const [naturalAspectRatio, setNaturalAspectRatio] = useState(aspectRatio)

    // persist all vapix parameters
    window.localStorage.setItem('vapix', JSON.stringify(parameters))

    const onToggle = useCallback(() => {
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
      setRefresh(value => value + 1)
      setWaiting(true)
    }, [])

    const onStop = useCallback(() => {
      setPlay(false)
      setHost('')
      setWaiting(false)
    }, [])

    const onFormat = (format: Format) => {
      switch (format) {
        case 'H264':
          setApi(AXIS_MEDIA_AMP)
          setParameters({ ...parameters, videocodec: 'h264' })
          break
        case 'MJPEG':
          setApi(AXIS_MEDIA_AMP)
          setParameters({ ...parameters, videocodec: 'jpeg' })
          break
        case 'JPEG':
          setApi(AXIS_IMAGE_CGI)
          break
        default:
        // no-op
      }
      setRefresh(value => value + 1)
    }

    const onVapix = (key: string, value: string) => {
      setParameters((p: typeof vapixParams) => {
        if (value === '') {
          delete p[key]
          return { ...p }
        }

        return { ...p, [key]: value }
      })
      setRefresh(value => value + 1)
    }

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

    const onPlaying = useCallback(
      (videoProperties: VideoProperties) => {
        const { width, height } = videoProperties
        setNaturalAspectRatio(width / height)
        setWaiting(false)
      },
      [setWaiting, setNaturalAspectRatio]
    )

    return (
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
            onPlay={onToggle}
            onStop={onStop}
            onRefresh={onRefresh}
            onFormat={onFormat}
            onVapix={onVapix}
            labels={{
              play: 'Play',
              pause: 'Pause',
              stop: 'Stop',
              refresh: 'Refresh',
              settings: 'Settings',
            }}
          />
        </Layer>
      </Container>
    )
  }
)

Player.displayName = 'Player'
