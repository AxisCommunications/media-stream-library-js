const Pipeline = require('./pipeline')
const RtspPipeline = require('./rtsp-pipeline')
const RtspJpegPipeline = require('./rtsp-jpeg-pipeline')
const RtspMp4Pipeline = require('./rtsp-mp4-pipeline')
const Html5CanvasPipeline = require('./html5-canvas-pipeline')
const Html5VideoPipeline = require('./html5-video-pipeline')
const Html5VideoXmlPipeline = require('./html5-video-xml-pipeline')
const Html5VideoMetadataPipeline = require('./html5-video-metadata-pipeline')

// Legacy "static" pipelines
const WebSocketRtspSdp = require('./websocket-rtsp-sdp')
const WebSocketRtspVideo = require('./websocket-rtsp-video')
const WebSocketRtspVideoXml = require('./websocket-rtsp-video-xml')
const WebSocketRtspXml = require('./websocket-rtsp-xml')

module.exports = {
  Pipeline,
  RtspPipeline,
  RtspJpegPipeline,
  RtspMp4Pipeline,
  Html5CanvasPipeline,
  Html5VideoPipeline,
  Html5VideoXmlPipeline,
  Html5VideoMetadataPipeline,
  WebSocketRtspSdp,
  WebSocketRtspVideo,
  WebSocketRtspVideoXml,
  WebSocketRtspXml
}
