export const responsesRaw = [
  `RTSP/1.0 200 OK
CSeq: 1
Public: OPTIONS, DESCRIBE, GET_PARAMETER, PAUSE, PLAY, SETUP, SET_PARAMETER, TEARDOWN
Server: GStreamer RTSP server
Date: Wed, 03 Jun 2015 14:23:41 GMT

`,
  `RTSP/1.0 200 OK
CSeq: 2
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
`,
  `RTSP/1.0 200 OK
CSeq: 3
Transport: RTP/AVP;unicast;client_port=40472-40473;server_port=50000-50001;ssrc=363E6C43;mode="PLAY"
Server: GStreamer RTSP server
Session: Bk48Ak7wjcWaAgRD; timeout=60
Date: Wed, 03 Jun 2015 14:23:42 GMT

`,
  `RTSP/1.0 200 OK
CSeq: 4
RTP-Info: url=rtsp://192.168.0.3/axis-media/media.amp/stream=0?resolution=176x144&fps=1;seq=10176;rtptime=2419713327
Range: npt=now-
Server: GStreamer RTSP server
Session: Bk48Ak7wjcWaAgRD; timeout=60
Date: Wed, 03 Jun 2015 14:23:42 GMT

`,
  `RTSP/1.0 200 OK
CSeq: 5
Server: GStreamer RTSP server
Session: Bk48Ak7wjcWaAgRD; timeout=60
Date: Wed, 03 Jun 2015 14:23:48 GMT

`,
]

export const responses = responsesRaw.map((item) => {
  return item.split('\n').join('\r\n')
})

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

export const sdpResponseVideoAudioSVG = `v=0
o=- 1188340656180883 1 IN IP4 192.168.0.96
s=Session streamed with GStreamer
i=rtsp-server
t=0 0
a=tool:GStreamer
a=type:broadcast
a=range:npt=now-
a=control:rtsp://192.168.0.90/axis-media/media.amp?video=1&audio=1&svg=on
m=video 0 RTP/AVP 96
c=IN IP4 0.0.0.0
b=AS:50000
a=rtpmap:96 H264/90000
a=fmtp:96 packetization-mode=1;profile-level-id=4d0032;sprop-parameter-sets=Z00AMuKQBRAevy4C3AQEBpB4kRU=,aO48gA==
a=control:rtsp://192.168.0.90/axis-media/media.amp/stream=0?video=1&audio=1&svg=on
a=framerate:12.000000
a=transform:1.000000,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000
m=audio 0 RTP/AVP 97
c=IN IP4 0.0.0.0
b=AS:32
a=rtpmap:97 MPEG4-GENERIC/16000/1
a=fmtp:97 streamtype=5;profile-level-id=2;mode=AAC-hbr;config=1408;sizelength=13;indexlength=3;indexdeltalength=3
a=control:rtsp://192.168.0.90/axis-media/media.amp/stream=1?video=1&audio=1&svg=on
m=application 0 RTP/AVP 99
c=IN IP4 0.0.0.0
a=rtpmap:99 image.svg.data/90000
a=control:rtsp://192.168.0.90/axis-media/media.amp/stream=2?video=1&audio=1&svg=on

`
  .split('\n')
  .join('\r\n')
