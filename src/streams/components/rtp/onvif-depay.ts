import { RtpMessage } from '../types/rtp'
import { MediaDescription, OnvifMedia } from '../types/sdp'
import { XmlMessage } from '../types/xml'

import { concat } from '../utils/bytes'

function isOnvifMedia(media: MediaDescription): media is OnvifMedia {
  return (
    media.type === 'application' &&
    media.rtpmap?.encodingName === 'VND.ONVIF.METADATA'
  )
}

export class ONVIFDepay {
  public payloadType?: number

  private payloads: Uint8Array[] = []

  constructor(media: MediaDescription[]) {
    const onvifMedia = media.find(isOnvifMedia)
    this.payloadType = onvifMedia?.rtpmap?.payloadType
  }

  parse(rtp: RtpMessage): XmlMessage | undefined {
    this.payloads.push(rtp.data)

    // XML over RTP uses the RTP marker bit to indicate end of fragmentation.
    // At this point, the stacked payloads can be used to reconstruct an XML
    // packet.
    if (!rtp.marker) {
      return
    }

    const data = concat(this.payloads)
    this.payloads = []

    return new XmlMessage({
      data,
      ntpTimestamp: rtp.ntpTimestamp,
      payloadType: rtp.payloadType,
      timestamp: rtp.timestamp,
    })
  }
}
