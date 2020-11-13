import { AXIS_MEDIA_AMP, AXIS_IMAGE_CGI } from '..'

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
