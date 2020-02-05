import { optionsRequest } from './fixtures';
import { builder } from './builder';
import { MessageType } from '../message';
describe('RtspParser builder', function () {
    it('builds a valid RTSP message from the passed in data', function () {
        var msg = {
            type: MessageType.RTSP,
            method: 'OPTIONS',
            uri: 'rtsp://192.168.0.3/axis-media/media.amp?resolution=176x144&fps=1',
            headers: {
                CSeq: '1',
                Date: 'Wed, 03 Jun 2015 14:26:16 GMT',
            },
            data: Buffer.alloc(0),
        };
        var data = builder(msg);
        expect(data.toString('ascii')).toEqual(optionsRequest);
    });
});
//# sourceMappingURL=builder.test.js.map