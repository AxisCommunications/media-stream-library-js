import React, { Ref } from 'react'

import debug from 'debug'
import {
  Html5CanvasPipeline,
  Html5VideoPipeline,
  HttpMsePipeline,
  Rtcp,
  Sdp,
  TransformationMatrix,
} from 'media-stream-library'

import { HttpMp4Video } from './HttpMp4Video'
import { MetadataHandler } from './metadata'
import { StillImage } from './StillImage'
import { Format } from './types'
import { WsRtspCanvas } from './WsRtspCanvas'
import { WsRtspVideo } from './WsRtspVideo'

export type PlayerNativeElement =
  | HTMLVideoElement
  | HTMLCanvasElement
  | HTMLImageElement

export type PlayerPipeline =
  | Html5VideoPipeline
  | Html5CanvasPipeline
  | HttpMsePipeline

const debugLog = debug('msp:api')

export enum AxisApi {
  'AXIS_IMAGE_CGI' = 'AXIS_IMAGE_CGI',
  'AXIS_MEDIA_AMP' = 'AXIS_MEDIA_AMP',
  'AXIS_MEDIA_CGI' = 'AXIS_MEDIA_CGI',
  'AXIS_MJPEG_CGI' = 'AXIS_MJPEG_CGI',
}

export enum Protocol {
  'HTTP' = 'http:',
  'HTTPS' = 'https:',
  'WS' = 'ws:',
  'WSS' = 'wss:',
}

export const FORMAT_API: Record<Format, AxisApi> = {
  RTP_H264: AxisApi.AXIS_MEDIA_AMP,
  RTP_JPEG: AxisApi.AXIS_MEDIA_AMP,
  MJPEG: AxisApi.AXIS_MJPEG_CGI,
  MP4_H264: AxisApi.AXIS_MEDIA_CGI,
  JPEG: AxisApi.AXIS_IMAGE_CGI,
}

export interface VapixParameters {
  readonly [key: string]: string
}

export type Range = readonly [number | undefined, number | undefined]

export interface VideoProperties {
  readonly el: PlayerNativeElement
  readonly width: number
  readonly height: number
  readonly formatSupportsAudio: boolean
  readonly pipeline?: PlayerPipeline
  readonly media?: ReadonlyArray<{
    readonly type: 'video' | 'audio' | 'data'
    readonly mime: string
  }>
  readonly volume?: number
  readonly range?: Range
  readonly sensorTm?: TransformationMatrix
}

interface PlaybackAreaProps {
  readonly forwardedRef?: Ref<PlayerNativeElement>
  readonly host: string
  readonly format: Format
  readonly parameters?: VapixParameters
  readonly play?: boolean
  readonly offset?: number
  readonly refresh: number
  readonly onPlaying: (properties: VideoProperties) => void
  readonly onEnded?: () => void
  readonly onSdp?: (msg: Sdp) => void
  readonly onRtcp?: (msg: Rtcp) => void
  readonly metadataHandler?: MetadataHandler
  readonly secure?: boolean
  /**
   * Activate automatic retries on RTSP errors.
   */
  readonly autoRetry?: boolean
}

const wsUri = (protocol: Protocol.WS | Protocol.WSS, host: string) => {
  return host.length !== 0 ? `${protocol}//${host}/rtsp-over-websocket` : ''
}

const rtspUri = (host: string, searchParams: string) => {
  return host.length !== 0
    ? `rtsp://${host}/axis-media/media.amp?${searchParams}`
    : ''
}

const mediaUri = (
  protocol: Protocol.HTTP | Protocol.HTTPS,
  host: string,
  searchParams: string
) => {
  return host.length !== 0
    ? `${protocol}//${host}/axis-cgi/media.cgi?${searchParams}`
    : ''
}

const imgUri = (
  protocol: Protocol.HTTP | Protocol.HTTPS,
  host: string,
  searchParams: string
) => {
  return host.length !== 0
    ? `${protocol}//${host}/axis-cgi/jpg/image.cgi?${searchParams}`
    : ''
}

const mjpegUri = (
  protocol: Protocol.HTTP | Protocol.HTTPS,
  host: string,
  searchParams: string
) => {
  return host.length !== 0
    ? `${protocol}//${host}/mjpg/video.mjpg?${searchParams}`
    : ''
}

/**
 * User-specified URI parameters.
 *
 * Note that parameters such as `videocodec` or `container` are automatically
 * set based on the chosen format (since they effect which component to use).
 */
const PARAMETERS: Record<AxisApi, ReadonlyArray<string>> = {
  [AxisApi.AXIS_IMAGE_CGI]: [
    'resolution',
    'camera',
    'compression',
    'rotation',
    'palette',
    'squarepixel',
    'timestamp',
  ],
  [AxisApi.AXIS_MEDIA_AMP]: [
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
    'videocodec',
  ],
  [AxisApi.AXIS_MEDIA_CGI]: [
    'container',
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
    'videocodec',
  ],
  [AxisApi.AXIS_MJPEG_CGI]: [
    'camera',
    'resolution',
    'streamprofile',
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
    'timestamp',
  ],
}

/**
 * searchParams
 *
 * Produce a (URI-encoded) search parameter string for use in a URL
 * from a list of key,value pairs. The keys are checked against the
 * known keys for a particular API.
 *
 * @param searchParamList a list of [key, value] pairs
 */
const searchParams = (api: AxisApi, parameters: VapixParameters = {}) => {
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
  format,
  parameters = {},
  play,
  offset,
  refresh,
  onPlaying,
  onEnded,
  onSdp,
  onRtcp,
  metadataHandler,
  secure = window.location.protocol === Protocol.HTTPS,
  autoRetry = false,
}) => {
  const timestamp = refresh.toString()

  if (format === Format.RTP_H264) {
    const ws = wsUri(secure ? Protocol.WSS : Protocol.WS, host)
    const rtsp = rtspUri(
      host,
      searchParams(FORMAT_API[format], {
        ...parameters,
        timestamp,
        videocodec: 'h264',
      })
    )

    return (
      <WsRtspVideo
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLVideoElement>}
        {...{
          ws,
          rtsp,
          play,
          offset,
          onPlaying,
          onEnded,
          onSdp,
          onRtcp,
          metadataHandler,
          autoRetry,
        }}
      />
    )
  }

  if (format === Format.RTP_JPEG) {
    const ws = wsUri(secure ? Protocol.WSS : Protocol.WS, host)
    const rtsp = rtspUri(
      host,
      searchParams(FORMAT_API[format], {
        ...parameters,
        timestamp,
        videocodec: 'jpeg',
      })
    )

    return (
      <WsRtspCanvas
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLCanvasElement>}
        {...{ ws, rtsp, play, offset, onPlaying, onEnded, onSdp, onRtcp }}
      />
    )
  }

  if (format === Format.JPEG) {
    const src = imgUri(
      secure ? Protocol.HTTPS : Protocol.HTTP,
      host,
      searchParams(FORMAT_API[format], {
        ...parameters,
        timestamp,
      })
    )

    return (
      <StillImage
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLImageElement>}
        {...{ src, play, onPlaying }}
      />
    )
  }

  if (format === Format.MJPEG) {
    const src = mjpegUri(
      secure ? Protocol.HTTPS : Protocol.HTTP,
      host,
      searchParams(FORMAT_API[format], {
        ...parameters,
        timestamp,
      })
    )

    return (
      <StillImage
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLImageElement>}
        {...{ src, play, onPlaying }}
      />
    )
  }

  if (format === Format.MP4_H264) {
    const src = mediaUri(
      secure ? Protocol.HTTPS : Protocol.HTTP,
      host,
      searchParams(FORMAT_API[format], {
        ...parameters,
        timestamp,
        videocodec: 'h264',
        container: 'mp4',
      })
    )

    return (
      <HttpMp4Video
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLVideoElement>}
        {...{ src, play, onPlaying, onEnded }}
      />
    )
  }

  console.warn(`Error: unknown format: ${format}, 
please use one of ${
    [
      Format.JPEG,
      Format.MJPEG,
      Format.MP4_H264,
      Format.RTP_H264,
      Format.RTP_JPEG,
    ].join(', ')
  }`)

  return null
}
