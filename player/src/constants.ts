import { Format } from './types'

export const FORMAT_SUPPORTS_AUDIO: Record<Format, boolean> = {
  RTP_H264: true,
  RTP_JPEG: false,
  MP4_H264: true,
  JPEG: false,
  MJPEG: false,
}
