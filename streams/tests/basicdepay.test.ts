import * as assert from 'uvu/assert'

import { toByteArray } from 'base64-js'

import { BasicDepay } from 'components/basicdepay'
import { MessageType } from 'components/message'

import { decode } from 'utils/bytes'
import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

const rtpMessage1 = {
  type: MessageType.RTP,
  data: toByteArray(
    'gGIrsXKxrCZG6KGHPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZ' +
      'z0iVVRGLTgiPz4KPHR0Ok1ldGFkYXRhU3RyZWFtIHhtbG5zOnR0PSJodHRwOi8vd3d3Lm9u' +
      'dmlmLm9yZy92ZXIxMC9zY2hlbWEiPgo8dHQ6UFRaPgo8dHQ6UFRaU3RhdHVzPgogIDx0dDp' +
      'VdGNUaW1lPjIwMTctMDMtMjlUMTI6MTU6MzEuNjEwMDIwWjwvdHQ6VXRjVGltZT4KPC90dDpQVFpTdGF0dXM='
  ),
}
const rtpMessage2 = {
  type: MessageType.RTP,
  data: toByteArray('gOIrsnKxrCZG6KGHL3R0OlBUWj4KPC90dDpNZXRhZGF0YVN0cmVhbT4K'),
}

describe('basicdepay', (test) => {
  const c = new BasicDepay(98)

  runComponentTests(c, 'basicdepay component', test)

  test('Rebuilds objects split over multiple RTP packages', () => {
    c.incoming.write(rtpMessage1)
    assert.is(c.incoming.read(), null) // No data should be available

    // Write the second part of the message
    c.incoming.write(rtpMessage2)
    const msg = c.incoming.read()
    assert.is(msg.type, MessageType.ELEMENTARY)
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
