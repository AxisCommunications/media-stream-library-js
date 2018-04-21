const Pipeline = require('./pipeline')
const RtspPipeline = require('./rtsp-pipeline')
const RtspMjpegPipeline = require('./rtsp-mjpeg-pipeline')
const RtspMp4Pipeline = require('./rtsp-mp4-pipeline')
const Html5CanvasPipeline = require('./html5-canvas-pipeline')
const Html5VideoPipeline = require('./html5-video-pipeline')
const Html5VideoMetadataPipeline = require('./html5-video-metadata-pipeline')

// Deprecated pipelines (may disappear next release)
const WebSocketRtspSdp = require('./websocket-rtsp-sdp')
const WebSocketRtspVideo = require('./websocket-rtsp-video')
const WebSocketRtspVideoXml = require('./websocket-rtsp-video-xml')
const WebSocketRtspXml = require('./websocket-rtsp-xml')
const Html5VideoXmlPipeline = require('./html5-video-xml-pipeline')

module.exports = {
  Pipeline,
  RtspPipeline,
  RtspMjpegPipeline,
  RtspMp4Pipeline,
  Html5CanvasPipeline,
  Html5VideoPipeline,
  Html5VideoMetadataPipeline,
  Html5VideoXmlPipeline,
  WebSocketRtspSdp,
  WebSocketRtspVideo,
  WebSocketRtspVideoXml,
  WebSocketRtspXml
}
