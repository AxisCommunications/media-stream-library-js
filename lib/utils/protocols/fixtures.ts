/* prettier-ignore */
export const rtpBuffers = [
  Buffer.from([128, 96, 80, 56, 225, 39, 20, 132, 25, 190, 186, 105]),
  Buffer.from([128, 224, 80, 76, 225, 39, 108, 97, 25, 190, 186, 105, 1, 2, 3]),
  Buffer.from([129, 224, 80, 95, 225, 40, 57, 104, 25, 190, 186, 105, 0, 0, 0, 1, 1, 2, 3])
];

/* prettier-ignore */
export const rtpBuffersWithHeaderExt = [
  Buffer.from([144, 224, 80, 76, 225, 39, 108, 97, 25, 190, 186, 105, 1, 2, 0, 0, 1, 2, 3]),
  Buffer.from([144, 224, 80, 76, 225, 39, 108, 97, 25, 190, 186, 105, 1, 2, 0, 1, 1, 2, 3, 4, 1, 2, 3])
];

/* prettier-ignore */
export const rtcpBuffers = [
  Buffer.from([128, 200, 0, 6, 250, 42, 84, 81, 218, 165, 232, 198, 26, 142, 79, 185, 102, 235, 61, 79, 0, 0, 6, 198, 0, 19, 131, 105, 129, 202, 0, 12, 250, 42, 84, 81, 1, 28, 117, 115, 101, 114, 49, 53, 53, 54, 52, 55, 56, 51, 53, 56, 64, 104, 111, 115, 116, 45, 57, 54, 57, 55, 97, 99, 98, 53, 6, 9, 71, 83, 116, 114, 101, 97, 109, 101, 114, 0, 0, 0]),
  Buffer.from([128, 200, 0, 6, 250, 42, 84, 81, 218, 165, 232, 198, 26, 142, 79, 185, 102, 235, 61, 79, 0, 0, 6, 198, 0, 19, 131, 105, 129, 202, 0, 12, 250, 42, 84, 81, 1, 28, 117, 115, 101, 114, 49, 53, 53, 54, 52, 55, 56, 51, 53, 56, 64, 104, 111, 115, 116, 45, 57, 54, 57, 55, 97, 99, 98, 53, 6, 9, 71, 83, 116, 114, 101, 97, 109, 101, 114, 0, 0, 0]),
  Buffer.from([128, 200, 0, 6, 250, 42, 84, 81, 218, 165, 232, 211, 115, 107, 110, 13, 102, 253, 145, 168, 0, 0, 7, 48, 0, 20, 180, 200, 129, 202, 0, 12, 250, 42, 84, 81, 1, 28, 117, 115, 101, 114, 49, 53, 53, 54, 52, 55, 56, 51, 53, 56, 64, 104, 111, 115, 116, 45, 57, 54, 57, 55, 97, 99, 98, 53, 6, 9, 71, 83, 116, 114, 101, 97, 109, 101, 114, 0, 0, 0])
];

export const sdpResponse = `RTSP/1.0 200 OK
CSeq: 3
Content-Type: application/sdp
Content-Base: rtsp://192.168.0.3/axis-media/media.amp/
Server: GStreamer RTSP server
Date: Wed, 03 Jun 2015 14:23:42 GMT
Content-Length: 623

v=0
o=- 1188340656180883 1 IN IP4 192.168.0.3
s=Session streamed with GStreamer
i=rtsp-server
t=0 0
a=tool:GStreamer
a=type:broadcast
a=range:npt=now-
a=control:rtsp://192.168.0.3/axis-media/media.amp?resolution=176x144&fps=1
m=video 0 RTP/AVP 96
c=IN IP4 0.0.0.0
b=AS:50000
a=rtpmap:96 H264/90000
a=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=Z00AKeKQWJ2AtwEBAaQeJEVA,aO48gA==
a=control:rtsp://192.168.0.3/axis-media/media.amp/stream=0?resolution=176x144&fps=1
a=framerate:1.000000
a=transform:0.916667,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000
`
  .split('\n')
  .join('\r\n')

export const sdpResponseLive555 = `RTSP/1.0 200 OK
CSeq: 2
Date: Wed, Apr 06 2016 07:05:30 GMT
Content-Base: rtsp://127.0.0.1:8554/out.svg/
Content-Type: application/sdp
Content-Length: 446

v=0
o=- 1459926330480681 1 IN IP4 192.168.0.97
s=SVG Streamable Vector Graphics, streamed by the LIVE555 Media Server
i=out.svg
t=0 0
a=control:*
a=tool:LIVE555 Streaming Media v2016.04.01
a=type:broadcast
a=range:npt=0-
a=x-qt-text-nam:SVG Streamable Vector Graphics, streamed by the LIVE555 Media Server
a=x-qt-text-inf:out.svg
m=application 0 RTP/AVP 99
c=IN IP4 0.0.0.0
b=AS:10
a=rtpmap:99 vnd.svg.data/90000
a=control:track1
`
  .split('\n')
  .join('\r\n')

export const setupResponse = `RTSP/1.0 200 OK
CSeq: 5
RTP-Info: url=rtsp://192.168.0.3/axis-media/media.amp/stream=0?resolution=176x144&fps=1;seq=10176;rtptime=2419713327
Range: npt=now-
Server: GStreamer RTSP server
Session: Bk48Ak7wjcWaAgRD; timeout=60
Date: Wed, 03 Jun 2015 14:23:42 GMT

`
  .split('\n')
  .join('\r\n')

export const setupResponseNoTimeout = `RTSP/1.0 200 OK
CSeq: 5
RTP-Info: url=rtsp://192.168.0.3/axis-media/media.amp/stream=0?resolution=176x144&fps=1;seq=10176;rtptime=2419713327
Range: npt=now-
Server: GStreamer RTSP server
Session: Bk48Ak7wjcWaAgRD
Date: Wed, 03 Jun 2015 14:23:42 GMT

`
  .split('\n')
  .join('\r\n')

export const teardownResponse = `RTSP/1.0 200 OK
CSeq: 5
Server: GStreamer RTSP server
Session: ZyHdf8Mn.$epq_8Z; timeout=60
Connection: close
Date: Tue, 23 Jun 2015 08:38:03 GMT

`
  .split('\n')
  .join('\r\n')

// Example response from issue #310, with lower-case "cseq"
export const optionsResponseLowerCase = `RTSP/1.0 200 OK
Server: H264DVR 1.0
cseq: 1
Public: OPTIONS, DESCRIBE, SETUP, TEARDOWN, GET_PARAMETER, PLAY, PAUSE

`
