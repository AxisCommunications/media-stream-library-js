import React, { Ref } from 'react'
import { Sdp } from 'media-stream-library/lib/utils/protocols/sdp'
import debug from 'debug'

import { PlayerNativeElement } from './Player'
import { WsRtspVideo } from './WsRtspVideo'
import { WsRtspCanvas } from './WsRtspCanvas'
import { StillImage } from './StillImage'
import { MetadataHandler } from './metadata'

const debugLog = debug('msp:api')

export const AXIS_IMAGE_CGI = 'jpg'
const AXIS_VIDEO_CGI = 'mjpg'
export const AXIS_MEDIA_AMP = 'media'

export interface VapixParameters {
  [key: string]: string
}

export interface VideoProperties {
  readonly el: PlayerNativeElement
  readonly width: number
  readonly height: number
  readonly media?: ReadonlyArray<{
    readonly type: 'video' | 'audio' | 'data'
    readonly mime: string
  }>
}

interface PlaybackAreaProps {
  forwardedRef?: Ref<PlayerNativeElement>
  host: string
  api: string
  parameters?: VapixParameters
  play?: boolean
  refresh: number
  onPlaying: (properties: VideoProperties) => void
  onSdp?: (msg: Sdp) => void
  metadataHandler?: MetadataHandler
}

const API_TYPES = new Set([AXIS_IMAGE_CGI, AXIS_VIDEO_CGI, AXIS_MEDIA_AMP])

const SUPPORTED_API_TYPES = new Set([AXIS_IMAGE_CGI, AXIS_MEDIA_AMP])

const AXIS_API = {
  [AXIS_IMAGE_CGI]: 'axis-cgi/jpg/image.cgi',
  [AXIS_VIDEO_CGI]: 'axis-cgi/mjpg/video.cgi',
  [AXIS_MEDIA_AMP]: 'axis-media/media.amp',
}

const DEFAULT_VIDEO_CODEC = 'h264'

const wsUri = (host: string) => {
  const wsProtocol = window.location.protocol === 'http:' ? 'ws:' : 'wss:'
  return host ? `${wsProtocol}//${host}/rtsp-over-websocket` : ''
}

const rtspUri = (host: string, searchParams: string) => {
  return host
    ? `rtsp://${host}/${AXIS_API[AXIS_MEDIA_AMP]}?${searchParams}`
    : ''
}

const imgUri = (host: string, searchParams: string) => {
  return host
    ? `http://${host}/${AXIS_API[AXIS_IMAGE_CGI]}?${searchParams}`
    : ''
}

const PARAMETERS = {
  [`${AXIS_IMAGE_CGI}`]: [
    'resolution',
    'camera',
    'compression',
    'rotation',
    'palette',
    'squarepixel',
    'timestamp',
  ],
  [`${AXIS_VIDEO_CGI}`]: [
    'resolution',
    'camera',
    'compression',
    'rotation',
    'palette',
    'squarepixel',
  ],
  [`${AXIS_MEDIA_AMP}`]: [
    'videocodec',
    'camera',
    'resolution',
    'h264profile',
    'streamprofile',
    'recordingid',
    'audio',
    'compression',
    'colorlevel',
    'color',
    'palette',
    'clock',
    'date',
    'text',
    'textstring',
    'textcolor',
    'textbackgroundcolor',
    'rotation',
    'textpos',
    'overlayimage',
    'overlaypos',
    'duration',
    'nbrofframes',
    'fps',
    'pull',
    'event',
    'timestamp',
  ],
}

const search = (api: string, parameters: VapixParameters = {}) => {
  if (!API_TYPES.has(api)) {
    throw new Error(`unknown API type ${api}`)
  }
  const parameterList = PARAMETERS[api]
  return Object.entries(parameters)
    .map(([key, value]) => {
      if (!parameterList.includes(key)) {
        debugLog(`undocumented VAPIX parameter ${key}`)
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')
}

export const PlaybackArea: React.FC<PlaybackAreaProps> = ({
  forwardedRef,
  host,
  api,
  parameters = {},
  play,
  refresh,
  onPlaying,
  onSdp,
  metadataHandler,
}) => {
  const searchParams = search(api, {
    ...parameters,
    timestamp: refresh.toString(),
  })

  switch (api) {
    case AXIS_MEDIA_AMP:
      const ws = wsUri(host)
      const rtsp = rtspUri(host, searchParams)
      const videocodec = parameters.videocodec || DEFAULT_VIDEO_CODEC

      switch (videocodec) {
        case 'h264':
          return (
            <WsRtspVideo
              key={refresh}
              forwardedRef={forwardedRef as Ref<HTMLVideoElement>}
              {...{
                ws,
                rtsp,
                play,
                onPlaying,
                onSdp,
                metadataHandler,
              }}
            />
          )
        case 'jpeg':
          return (
            <WsRtspCanvas
              key={refresh}
              forwardedRef={forwardedRef as Ref<HTMLCanvasElement>}
              {...{ ws, rtsp, play, onPlaying }}
            />
          )
        default:
          return null
      }
    case AXIS_IMAGE_CGI:
      const src = imgUri(host, searchParams)
      return (
        <StillImage
          key={refresh}
          forwardedRef={forwardedRef as Ref<HTMLImageElement>}
          {...{ src, play, onPlaying }}
        />
      )
    case AXIS_VIDEO_CGI:
      console.warn(`if you want to use motion JPEG, use type '${AXIS_MEDIA_AMP}'
with videocodec=jpeg instead of type '${AXIS_VIDEO_CGI}'`)
    // fallthrough
    default:
      console.warn(`not implemented: API type ${api},
please use one of ${[...SUPPORTED_API_TYPES.values()]}`)
      return null
  }
}
