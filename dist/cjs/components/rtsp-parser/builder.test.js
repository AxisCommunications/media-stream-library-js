"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fixtures_1 = require("./fixtures");
const builder_1 = require("./builder");
const message_1 = require("../message");
describe('RtspParser builder', () => {
    it('builds a valid RTSP message from the passed in data', () => {
        const msg = {
            type: message_1.MessageType.RTSP,
            method: 'OPTIONS',
            uri: 'rtsp://192.168.0.3/axis-media/media.amp?resolution=176x144&fps=1',
            headers: {
                CSeq: '1',
                Date: 'Wed, 03 Jun 2015 14:26:16 GMT',
            },
            data: Buffer.alloc(0),
        };
        const data = builder_1.builder(msg);
        expect(data.toString('ascii')).toEqual(fixtures_1.optionsRequest);
    });
});
//# sourceMappingURL=builder.test.js.map