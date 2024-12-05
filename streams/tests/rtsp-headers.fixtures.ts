/* biome-ignore format: custom formatting */
export const rtcpSRBuffers = [
  // 0 reports
  new Uint8Array([
    128, 200, 0, 6, 243, 203, 32, 1, 131, 171, 3, 161, 235, 2, 11, 58, 0, 0,
    148, 32, 0, 0, 0, 158, 0, 0, 155, 136,
  ]),

  // 3 reports
  new Uint8Array([
    131, 200, 0, 24, 243, 203, 32, 1, 131, 171, 3, 161, 235, 2, 11, 58, 0, 0,
    148, 32, 0, 0, 0, 158, 0, 0, 155, 136, 0, 0, 0, 1, 4, 0, 0, 10, 0, 0, 0,
    1000, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 2, 4, 0, 0, 11, 0, 0, 0,
    1001, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 3, 4, 0, 0, 12, 0, 0, 0,
    1002, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 13,
  ]),
]

/* biome-ignore format: custom formatting */
export const rtcpRRBuffers = [
  // 0 reports
  new Uint8Array([128, 201, 0, 1, 27, 117, 249, 76]),

  // 3 reports
  new Uint8Array([
    131, 201, 0, 19, 27, 117, 249, 76, 0, 0, 0, 1, 4, 0, 0, 10, 0, 0, 0, 1000,
    0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 2, 4, 0, 0, 11, 0, 0, 0, 1001,
    0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 3, 4, 0, 0, 12, 0, 0, 0, 1002,
    0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 13,
  ]),
]

/* biome-ignore format: custom formatting */
export const rtcpSDESBuffers = [
  new Uint8Array([
    129, 202, 0, 12, 217, 157, 189, 215, 1, 28, 117, 115, 101, 114, 50, 53, 48,
    51, 49, 52, 53, 55, 54, 54, 64, 104, 111, 115, 116, 45, 50, 57, 50, 48, 53,
    57, 53, 50, 6, 9, 71, 83, 116, 114, 101, 97, 109, 101, 114, 0, 0, 0,
  ]),

  // 2 chunks (1+2 priv)
  new Uint8Array([
    130,
    202,
    0,
    12,
    0,
    0,
    0,
    1,
    1,
    6,
    67,
    78,
    65,
    77,
    69,
    49,
    8,
    5,
    2,
    67,
    49,
    86,
    49,
    0, // 5 words
    0,
    0,
    0,
    2,
    1,
    6,
    67,
    78,
    65,
    77,
    69,
    50,
    8,
    5,
    2,
    67,
    50,
    86,
    50,
    8,
    5,
    2,
    67,
    51,
    86,
    51,
    0,
    0, // 7 words
  ]),
]

/* biome-ignore format: custom formatting */
export const rtcpBYEBuffers = [
  new Uint8Array([129, 203, 0, 1, 38, 197, 204, 95]),

  // 0 byes (valid, but useless)
  new Uint8Array([128, 203, 0, 0]),

  // 3 byes + reason (valid, but useless)
  new Uint8Array([
    131, 203, 0, 5, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 4, 76, 111, 115, 116, 0,
    0, 0,
  ]),
]

/* biome-ignore format: custom formatting */
export const rtcpAPPBuffers = [
  new Uint8Array([
    133, 204, 0, 4, 0, 0, 0, 42, 76, 105, 102, 101, 0, 1, 2, 3, 42, 42, 42, 42,
  ]),
]

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
Session: Bk48Ak7wjcWaAgRD; timeout=120
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
