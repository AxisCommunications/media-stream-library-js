import { MessageType } from '../message';
import { BasicDepay } from '.';
import { runComponentTests } from '../../utils/validate-component';
const rtpMessage1 = {
    type: MessageType.RTP,
    data: Buffer.from('gGIrsXKxrCZG6KGHPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZ' +
        'z0iVVRGLTgiPz4KPHR0Ok1ldGFkYXRhU3RyZWFtIHhtbG5zOnR0PSJodHRwOi8vd3d3Lm9u' +
        'dmlmLm9yZy92ZXIxMC9zY2hlbWEiPgo8dHQ6UFRaPgo8dHQ6UFRaU3RhdHVzPgogIDx0dDp' +
        'VdGNUaW1lPjIwMTctMDMtMjlUMTI6MTU6MzEuNjEwMDIwWjwvdHQ6VXRjVGltZT4KPC90dDpQVFpTdGF0dXM', 'base64'),
};
const rtpMessage2 = {
    type: MessageType.RTP,
    data: Buffer.from('gOIrsnKxrCZG6KGHL3R0OlBUWj4KPC90dDpNZXRhZGF0YVN0cmVhbT4K', 'base64'),
};
describe('is a valid component', () => {
    const c = new BasicDepay(99);
    runComponentTests(c, 'mp4muxer component');
});
test('Rebuilds objects split over multiple RTP packages', () => {
    const c = new BasicDepay(98);
    c.incoming.write(rtpMessage1);
    expect(c.incoming.read()).toEqual(null); // No data should be available
    // Write the second part of the message
    c.incoming.write(rtpMessage2);
    const msg = c.incoming.read();
    expect(msg.type).toEqual(MessageType.ELEMENTARY);
    expect(msg.data.toString()).toEqual(`<?xml version="1.0" encoding="UTF-8"?>
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">
<tt:PTZ>
<tt:PTZStatus>
  <tt:UtcTime>2017-03-29T12:15:31.610020Z</tt:UtcTime>
</tt:PTZStatus/tt:PTZ>
</tt:MetadataStream>
`);
});
//# sourceMappingURL=index.test.js.map