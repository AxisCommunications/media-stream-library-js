import { Format } from '../types'

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaSource
 * Most browsers supports this, except Safari on iPhone
 */
const MSE_SUPPORT = 'MediaSource' in window

const isMJPEGSupported = () => {
  const isInternetExplorer =
    navigator.userAgent.includes('MSIE') || 'ActiveXObject' in window
  return !isInternetExplorer
}

const isH264Supported = () => {
  const element = document.createElement('video')

  const type = element.canPlayType('video/mp4; codecs="avc1.640029"')

  // Note: 'maybe' and 'probably' are both considered true here
  return type !== ''
}

export const browserSupportedFormats: Record<Format, boolean> = {
  [Format.RTP_H264]: isH264Supported() && MSE_SUPPORT,
  [Format.RTP_JPEG]: isMJPEGSupported(),
  [Format.JPEG]: true,
  [Format.MJPEG]: isMJPEGSupported(),
  [Format.MP4_H264]: isH264Supported(),
}
