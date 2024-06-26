import * as assert from 'uvu/assert'

import { AACDepay } from 'components/aacdepay'
import { Message, MessageType } from 'components/message'
import { payload } from 'utils/protocols/rtp'
import { messageFromBuffer } from 'utils/protocols/sdp'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

const sdpMessage = messageFromBuffer(
  Buffer.from(`
v=0
o=- 18315797286303868614 1 IN IP4 127.0.0.1
s=Session streamed with GStreamer
i=rtsp-server
t=0 0
a=tool:GStreamer
a=type:broadcast
a=range:npt=now-
a=control:rtsp://hostname/axis-media/media.amp?audio=1&video=1
m=video 0 RTP/AVP 96
c=IN IP4 0.0.0.0
b=AS:50000
a=rtpmap:96 H264/90000
a=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==
a=control:rtsp://hostname/axis-media/media.amp/stream=0?audio=1&video=1
a=framerate:25.000000
a=transform:1.000000,0.000000,0.000000;0.000000,0.750000,0.000000;0.000000,0.000000,1.000000
m=audio 0 RTP/AVP 97
c=IN IP4 0.0.0.0
b=AS:32
a=rtpmap:97 MPEG4-GENERIC/16000/1
a=fmtp:97 streamtype=5;profile-level-id=2;mode=AAC-hbr;config=1408;sizeLength=13;indexlength=3;indexdeltalength=3;bitrate=32000
a=control:rtsp://hostname/axis-media/media.amp/stream=1?audio=1&video=1
`)
)
const rtpMessage = {
  type: MessageType.RTP,
  data: Buffer.from(
    'gOE3VgfSkcjtSUMVABAHyAEmNa0UobgEQutal+Vl5JNVvdLtBVkkrFXytphSh4iIAIi/D647wkC+' +
      '+19nzXfn1DVGN9b7rquOONOLHxYfa+X1KnPvneEN+D/t5v152p9RC8X9/5/DcR/M65g/v/P7XxH+T9pePb/5/f8F/g/oU' +
      'vtf9fh77sHwGgZn6v5/d7B95wlR7Ht67gOMPgE3FyU104ciaEGj5lElEouptaCTg0M3yBAizaANAjth8RpWzgLktGZd8xw' +
      'uDXEzn3j+Gn55+yaLrEDqB1iVbQBWbRmv1ZjfCQBmKBw/b5Mw/xH+kP8LADeDgAAAAAAAAAAAAAAAAAAAAAAAAAAAew==',
    'base64'
  ),
}

describe('aacdepay component', (test) => {
  const c = new AACDepay()
  runComponentTests(c, 'aacdepay', test)

  test('Emits an AAC package with headers cut', () => {
    c.incoming.write(sdpMessage)
    c.incoming.write(rtpMessage)
    c.incoming.read() // Skip sdp which is passed through
    const msg: Message = c.incoming.read()
    assert.is(msg.type, MessageType.ELEMENTARY)
    // The header should be cut
    assert.is(msg.data.length + 4, payload(rtpMessage.data).length)
  })
})
