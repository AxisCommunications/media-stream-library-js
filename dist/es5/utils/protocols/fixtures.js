/* prettier-ignore */
export var rtpBuffers = [
    Buffer.from([128, 96, 80, 56, 225, 39, 20, 132, 25, 190, 186, 105]),
    Buffer.from([128, 224, 80, 76, 225, 39, 108, 97, 25, 190, 186, 105, 1, 2, 3]),
    Buffer.from([129, 224, 80, 95, 225, 40, 57, 104, 25, 190, 186, 105, 0, 0, 0, 1, 1, 2, 3])
];
/* prettier-ignore */
export var rtpBuffersWithHeaderExt = [
    Buffer.from([144, 224, 80, 76, 225, 39, 108, 97, 25, 190, 186, 105, 1, 2, 0, 0, 1, 2, 3]),
    Buffer.from([144, 224, 80, 76, 225, 39, 108, 97, 25, 190, 186, 105, 1, 2, 0, 1, 1, 2, 3, 4, 1, 2, 3])
];
/* prettier-ignore */
export var rtcpBuffers = [
    Buffer.from([128, 200, 0, 6, 250, 42, 84, 81, 218, 165, 232, 198, 26, 142, 79, 185, 102, 235, 61, 79, 0, 0, 6, 198, 0, 19, 131, 105, 129, 202, 0, 12, 250, 42, 84, 81, 1, 28, 117, 115, 101, 114, 49, 53, 53, 54, 52, 55, 56, 51, 53, 56, 64, 104, 111, 115, 116, 45, 57, 54, 57, 55, 97, 99, 98, 53, 6, 9, 71, 83, 116, 114, 101, 97, 109, 101, 114, 0, 0, 0]),
    Buffer.from([128, 200, 0, 6, 250, 42, 84, 81, 218, 165, 232, 198, 26, 142, 79, 185, 102, 235, 61, 79, 0, 0, 6, 198, 0, 19, 131, 105, 129, 202, 0, 12, 250, 42, 84, 81, 1, 28, 117, 115, 101, 114, 49, 53, 53, 54, 52, 55, 56, 51, 53, 56, 64, 104, 111, 115, 116, 45, 57, 54, 57, 55, 97, 99, 98, 53, 6, 9, 71, 83, 116, 114, 101, 97, 109, 101, 114, 0, 0, 0]),
    Buffer.from([128, 200, 0, 6, 250, 42, 84, 81, 218, 165, 232, 211, 115, 107, 110, 13, 102, 253, 145, 168, 0, 0, 7, 48, 0, 20, 180, 200, 129, 202, 0, 12, 250, 42, 84, 81, 1, 28, 117, 115, 101, 114, 49, 53, 53, 54, 52, 55, 56, 51, 53, 56, 64, 104, 111, 115, 116, 45, 57, 54, 57, 55, 97, 99, 98, 53, 6, 9, 71, 83, 116, 114, 101, 97, 109, 101, 114, 0, 0, 0])
];
export var sdpResponse = "RTSP/1.0 200 OK\nCSeq: 3\nContent-Type: application/sdp\nContent-Base: rtsp://192.168.0.3/axis-media/media.amp/\nServer: GStreamer RTSP server\nDate: Wed, 03 Jun 2015 14:23:42 GMT\nContent-Length: 623\n\nv=0\no=- 1188340656180883 1 IN IP4 192.168.0.3\ns=Session streamed with GStreamer\ni=rtsp-server\nt=0 0\na=tool:GStreamer\na=type:broadcast\na=range:npt=now-\na=control:rtsp://192.168.0.3/axis-media/media.amp?resolution=176x144&fps=1\nm=video 0 RTP/AVP 96\nc=IN IP4 0.0.0.0\nb=AS:50000\na=rtpmap:96 H264/90000\na=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=Z00AKeKQWJ2AtwEBAaQeJEVA,aO48gA==\na=control:rtsp://192.168.0.3/axis-media/media.amp/stream=0?resolution=176x144&fps=1\na=framerate:1.000000\na=transform:0.916667,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000\n"
    .split('\n')
    .join('\r\n');
export var sdpResponseLive555 = "RTSP/1.0 200 OK\nCSeq: 2\nDate: Wed, Apr 06 2016 07:05:30 GMT\nContent-Base: rtsp://127.0.0.1:8554/out.svg/\nContent-Type: application/sdp\nContent-Length: 446\n\nv=0\no=- 1459926330480681 1 IN IP4 192.168.0.97\ns=SVG Streamable Vector Graphics, streamed by the LIVE555 Media Server\ni=out.svg\nt=0 0\na=control:*\na=tool:LIVE555 Streaming Media v2016.04.01\na=type:broadcast\na=range:npt=0-\na=x-qt-text-nam:SVG Streamable Vector Graphics, streamed by the LIVE555 Media Server\na=x-qt-text-inf:out.svg\nm=application 0 RTP/AVP 99\nc=IN IP4 0.0.0.0\nb=AS:10\na=rtpmap:99 vnd.svg.data/90000\na=control:track1\n"
    .split('\n')
    .join('\r\n');
export var setupResponse = "RTSP/1.0 200 OK\nCSeq: 5\nRTP-Info: url=rtsp://192.168.0.3/axis-media/media.amp/stream=0?resolution=176x144&fps=1;seq=10176;rtptime=2419713327\nRange: npt=now-\nServer: GStreamer RTSP server\nSession: Bk48Ak7wjcWaAgRD; timeout=60\nDate: Wed, 03 Jun 2015 14:23:42 GMT\n\n"
    .split('\n')
    .join('\r\n');
export var setupResponseNoTimeout = "RTSP/1.0 200 OK\nCSeq: 5\nRTP-Info: url=rtsp://192.168.0.3/axis-media/media.amp/stream=0?resolution=176x144&fps=1;seq=10176;rtptime=2419713327\nRange: npt=now-\nServer: GStreamer RTSP server\nSession: Bk48Ak7wjcWaAgRD\nDate: Wed, 03 Jun 2015 14:23:42 GMT\n\n"
    .split('\n')
    .join('\r\n');
export var teardownResponse = "RTSP/1.0 200 OK\nCSeq: 5\nServer: GStreamer RTSP server\nSession: ZyHdf8Mn.$epq_8Z; timeout=60\nConnection: close\nDate: Tue, 23 Jun 2015 08:38:03 GMT\n\n"
    .split('\n')
    .join('\r\n');
//# sourceMappingURL=fixtures.js.map