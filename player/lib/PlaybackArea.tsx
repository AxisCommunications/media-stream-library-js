import React, { Ref } from 'react'
import { Sdp, pipelines } from 'media-stream-library'
import debug from 'debug'

import { WsRtspVideo } from './WsRtspVideo'
import { WsRtspCanvas } from './WsRtspCanvas'
import { StillImage } from './StillImage'
import { MetadataHandler } from './metadata'
import { HttpMp4Video } from './HttpMp4Video'

export type PlayerNativeElement =
  | HTMLVideoElement
  | HTMLCanvasElement
  | HTMLImageElement

const debugLog = debug('msp:api')

export enum AxisApi {
  'AXIS_IMAGE_CGI' = 'AXIS_IMAGE_CGI',
  'AXIS_MEDIA_AMP' = 'AXIS_MEDIA_AMP',
  'AXIS_MEDIA_CGI' = 'AXIS_MEDIA_CGI',
}

export enum Format {
  'RTP_H264' = 'RTP_H264',
  'RTP_JPEG' = 'RTP_JPEG',
  'JPEG' = 'JPEG',
  'MP4_H264' = 'MP4_H264',
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
  MP4_H264: AxisApi.AXIS_MEDIA_CGI,
  JPEG: AxisApi.AXIS_IMAGE_CGI,
}

export interface VapixParameters {
  readonly [key: string]: string
}

export interface VideoProperties {
  readonly el: PlayerNativeElement
  readonly width: number
  readonly height: number
  readonly pipeline?: pipelines.Html5VideoPipeline
  readonly media?: ReadonlyArray<{
    readonly type: 'video' | 'audio' | 'data'
    readonly mime: string
  }>
  readonly volume?: number
}

interface PlaybackAreaProps {
  readonly forwardedRef?: Ref<PlayerNativeElement>
  readonly host: string
  readonly format: Format
  readonly parameters?: VapixParameters
  readonly play?: boolean
  readonly refresh: number
  readonly onPlaying: (properties: VideoProperties) => void
  readonly onSdp?: (msg: Sdp) => void
  readonly metadataHandler?: MetadataHandler
  readonly secure?: boolean
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
  searchParams: string,
) => {
  return host.length !== 0
    ? `${protocol}//${host}/axis-cgi/media.cgi?${searchParams}`
    : ''
}

const imgUri = (
  protocol: Protocol.HTTP | Protocol.HTTPS,
  host: string,
  searchParams: string,
) => {
  return host.length !== 0
    ? `${protocol}//${host}/axis-cgi/jpg/image.cgi?${searchParams}`
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
  refresh,
  onPlaying,
  onSdp,
  metadataHandler,
  secure = window.location.protocol === Protocol.HTTPS,
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
      }),
    )

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
  }

  if (format === Format.RTP_JPEG) {
    const ws = wsUri(secure ? Protocol.WSS : Protocol.WS, host)
    const rtsp = rtspUri(
      host,
      searchParams(FORMAT_API[format], {
        ...parameters,
        timestamp,
        videocodec: 'jpeg',
      }),
    )

    return (
      <WsRtspCanvas
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLCanvasElement>}
        {...{ ws, rtsp, play, onPlaying }}
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
      }),
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
      }),
    )

    return (
      <HttpMp4Video
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLVideoElement>}
        {...{ src, play, onPlaying }}
      />
    )
  }

  console.warn(`Error: unknown format: ${format},
please use one of ${[
    Format.RTP_H264,
    Format.JPEG,
    Format.MP4_H264,
    Format.RTP_JPEG,
  ].join(', ')}`)

  return null
}
