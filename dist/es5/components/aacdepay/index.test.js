import { AACDepay } from '.';
import { payload } from '../../utils/protocols/rtp';
import { messageFromBuffer } from '../../utils/protocols/sdp';
import { MessageType } from '../message';
import { runComponentTests } from '../../utils/validate-component';
var sdpMessage = messageFromBuffer(Buffer.from("\nv=0\no=- 18315797286303868614 1 IN IP4 127.0.0.1\ns=Session streamed with GStreamer\ni=rtsp-server\nt=0 0\na=tool:GStreamer\na=type:broadcast\na=range:npt=now-\na=control:rtsp://hostname/axis-media/media.amp?audio=1&video=1\nm=video 0 RTP/AVP 96\nc=IN IP4 0.0.0.0\nb=AS:50000\na=rtpmap:96 H264/90000\na=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==\na=control:rtsp://hostname/axis-media/media.amp/stream=0?audio=1&video=1\na=framerate:25.000000\na=transform:1.000000,0.000000,0.000000;0.000000,0.750000,0.000000;0.000000,0.000000,1.000000\nm=audio 0 RTP/AVP 97\nc=IN IP4 0.0.0.0\nb=AS:32\na=rtpmap:97 MPEG4-GENERIC/16000/1\na=fmtp:97 streamtype=5;profile-level-id=2;mode=AAC-hbr;config=1408;sizeLength=13;indexlength=3;indexdeltalength=3;bitrate=32000\na=control:rtsp://hostname/axis-media/media.amp/stream=1?audio=1&video=1\n"));
var rtpMessage = {
    type: MessageType.RTP,
    data: Buffer.from('gOE3VgfSkcjtSUMVABAHyAEmNa0UobgEQutal+Vl5JNVvdLtBVkkrFXytphSh4iIAIi/D647wkC+' +
        '+19nzXfn1DVGN9b7rquOONOLHxYfa+X1KnPvneEN+D/t5v152p9RC8X9/5/DcR/M65g/v/P7XxH+T9pePb/5/f8F/g/oU' +
        'vtf9fh77sHwGgZn6v5/d7B95wlR7Ht67gOMPgE3FyU104ciaEGj5lElEouptaCTg0M3yBAizaANAjth8RpWzgLktGZd8xw' +
        'uDXEzn3j+Gn55+yaLrEDqB1iVbQBWbRmv1ZjfCQBmKBw/b5Mw/xH+kP8LADeDgAAAAAAAAAAAAAAAAAAAAAAAAAAAew==', 'base64'),
};
describe('is a valid component', function () {
    var c = new AACDepay();
    runComponentTests(c, 'mp4muxer component');
});
test('Emits an AAC package with headers cut', function () {
    var c = new AACDepay();
    c.incoming.write(sdpMessage);
    c.incoming.write(rtpMessage);
    c.incoming.read(); // Skip sdp which is passed through
    var msg = c.incoming.read();
    expect(msg.type).toEqual(MessageType.ELEMENTARY);
    // The header should be cut
    expect(msg.data.length + 4).toEqual(payload(rtpMessage.data).length);
});
//# sourceMappingURL=index.test.js.map