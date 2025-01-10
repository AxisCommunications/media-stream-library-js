import { ElementaryMessage } from '../types/aac'
import { RtpMessage } from '../types/rtp'
import { MediaDescription, isAACMedia } from '../types/sdp'

import { readUInt16BE } from '../utils/bytes'

/*
media: [{ type: 'video',
   port: '0',
   proto: 'RTP/AVP',
   fmt: '96',
   rtpmap: '96 H264/90000',
   fmtp: {
      format: '96',
      parameters: {
        'packetization-mode': '1',
        'profile-level-id': '4d0029',
        'sprop-parameter-sets': 'Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==',
      },
    },
   control: 'rtsp://hostname/axis-media/media.amp/stream=0?audio=1&video=1',
   framerate: '25.000000',
   transform: [[1, 0, 0], [0, 0.75, 0], [0, 0, 1]] },
   { type: 'audio',
     port: '0',
     proto: 'RTP/AVP',
     fmt: '97',
     fmtp: {
       parameters: {
         bitrate: '32000',
         config: '1408',
         indexdeltalength: '3',
         indexlength: '3',
         mode: 'AAC-hbr',
         'profile-level-id': '2',
         sizelength: '13',
         streamtype: '5'
       },
       format: '97'
     },
     rtpmap: '97 MPEG4-GENERIC/16000/1',
     control: 'rtsp://hostname/axis-media/media.amp/stream=1?audio=1&video=1' }]
*/

/*
From RFC 3640 https://tools.ietf.org/html/rfc3640
  2.11.  Global Structure of Payload Format

     The RTP payload following the RTP header, contains three octet-
     aligned data sections, of which the first two MAY be empty, see
     Figure 1.

           +---------+-----------+-----------+---------------+
           | RTP     | AU Header | Auxiliary | Access Unit   |
           | Header  | Section   | Section   | Data Section  |
           +---------+-----------+-----------+---------------+

                     <----------RTP Packet Payload----------->

              Figure 1: Data sections within an RTP packet
Note that auxilary section is empty for AAC-hbr

  3.2.1.  The AU Header Section

   When present, the AU Header Section consists of the AU-headers-length
   field, followed by a number of AU-headers, see Figure 2.

      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- .. -+-+-+-+-+-+-+-+-+-+
      |AU-headers-length|AU-header|AU-header|      |AU-header|padding|
      |                 |   (1)   |   (2)   |      |   (n)   | bits  |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- .. -+-+-+-+-+-+-+-+-+-+

                   Figure 2: The AU Header Section
*/

export class AACDepay {
  public payloadType?: number

  private hasHeader = false

  constructor(media: MediaDescription[]) {
    const aacMedia = media.find(isAACMedia)

    if (aacMedia?.rtpmap !== undefined) {
      const parameters = aacMedia.fmtp.parameters
      // Required
      const sizeLength = Number(parameters.sizelength) || 0
      const indexLength = Number(parameters.indexlength) || 0
      const indexDeltaLength = Number(parameters.indexdeltalength) || 0
      // Optionals
      const CTSDeltaLength = Number(parameters.ctsdeltalength) || 0
      const DTSDeltaLength = Number(parameters.dtsdeltalength) || 0
      const RandomAccessIndication =
        Number(parameters.randomaccessindication) || 0
      const StreamStateIndication =
        Number(parameters.streamstateindication) || 0
      const AuxiliaryDataSizeLength =
        Number(parameters.auxiliarydatasizelength) || 0

      this.hasHeader =
        sizeLength +
          Math.max(indexLength, indexDeltaLength) +
          CTSDeltaLength +
          DTSDeltaLength +
          RandomAccessIndication +
          StreamStateIndication +
          AuxiliaryDataSizeLength >
        0
    }

    this.payloadType = aacMedia?.rtpmap?.payloadType
  }

  public parse(rtp: RtpMessage): ElementaryMessage {
    const payload = rtp.data

    let headerLength = 0
    if (this.hasHeader) {
      const auHeaderLengthInBits = readUInt16BE(payload, 0)
      headerLength = 2 + (auHeaderLengthInBits + (auHeaderLengthInBits % 8)) / 8 // Add padding
    }

    return new ElementaryMessage({
      data: new Uint8Array(payload.subarray(headerLength)),
      payloadType: rtp.payloadType,
      timestamp: rtp.timestamp,
      ntpTimestamp: rtp.ntpTimestamp,
    })
  }
}
