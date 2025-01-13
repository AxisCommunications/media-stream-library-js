import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import { toByteArray } from 'base64-js'

import { ONVIFDepay, RtpMessage, XmlMessage } from '../src/streams/components'

import { parseRtp } from '../src/streams/components/rtsp/rtp'
import { decode } from '../src/streams/components/utils/bytes'

const rtp1 = toByteArray(
  'gGIrsXKxrCZG6KGHPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZ' +
    'z0iVVRGLTgiPz4KPHR0Ok1ldGFkYXRhU3RyZWFtIHhtbG5zOnR0PSJodHRwOi8vd3d3Lm9u' +
    'dmlmLm9yZy92ZXIxMC9zY2hlbWEiPgo8dHQ6UFRaPgo8dHQ6UFRaU3RhdHVzPgogIDx0dDp' +
    'VdGNUaW1lPjIwMTctMDMtMjlUMTI6MTU6MzEuNjEwMDIwWjwvdHQ6VXRjVGltZT4KPC90dDpQVFpTdGF0dXM='
)

const rtp2 = toByteArray(
  'gOIrsnKxrCZG6KGHL3R0OlBUWj4KPC90dDpNZXRhZGF0YVN0cmVhbT4K'
)

const rtpMessage1 = new RtpMessage({
  channel: 2,
  ...parseRtp(rtp1),
})

const rtpMessage2 = new RtpMessage({
  channel: 2,
  ...parseRtp(rtp2),
})

describe('onvifdepay', (test) => {
  test('Rebuilds objects split over multiple RTP packages', () => {
    const onvifDepay = new ONVIFDepay([
      {
        type: 'application',
        port: 0,
        protocol: 'RTP/AVP',
        fmt: 98,
        fmtp: { format: '', parameters: {} },
        rtpmap: {
          payloadType: 98,
          encodingName: 'VND.ONVIF.METADATA',
          clockrate: 0,
        },
      },
    ])

    let msg: XmlMessage | undefined
    msg = onvifDepay.parse(rtpMessage1)
    assert.is(msg, undefined) // No data should be available

    // Write the second part of the message
    msg = onvifDepay.parse(rtpMessage2)
    assert.ok(msg)
    assert.is(msg.type, 'xml')
    assert.is(
      decode(msg.data),
      `<?xml version="1.0" encoding="UTF-8"?>
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">
<tt:PTZ>
<tt:PTZStatus>
  <tt:UtcTime>2017-03-29T12:15:31.610020Z</tt:UtcTime>
</tt:PTZStatus/tt:PTZ>
</tt:MetadataStream>
`
    )
  })
})
