import * as assert from 'uvu/assert'

import { MessageType, RtspMessage } from 'components/message'
import { builder } from 'components/rtsp-parser/builder'

import { optionsRequest } from './rtsp-parser.fixtures'
import { describe } from './uvu-describe'

describe('rtsp-parser builder', (test) => {
  test('builds a valid RTSP message from the passed in data', () => {
    const msg: RtspMessage = {
      type: MessageType.RTSP,
      method: 'OPTIONS',
      uri: 'rtsp://192.168.0.3/axis-media/media.amp?resolution=176x144&fps=1',
      headers: {
        CSeq: '1',
        Date: 'Wed, 03 Jun 2015 14:26:16 GMT',
      },
      data: Buffer.alloc(0),
    }
    const data = builder(msg)

    assert.is(data.toString('ascii'), optionsRequest)
  })
})
