const Pipeline = require('./pipeline')
const RtspPipeline = require('./rtsp-pipeline')
const RtspJpegPipeline = require('./rtsp-jpeg-pipeline')
const RtspMp4Pipeline = require('./rtsp-mp4-pipeline')
const CliMjpegPipeline = require('./cli-mjpeg-pipeline')
const CliVideoPipeline = require('./cli-video-pipeline')
const TcpWsPipeline = require('./tcp-ws-pipeline')

module.exports = {
  Pipeline,
  RtspPipeline,
  RtspJpegPipeline,
  RtspMp4Pipeline,
  CliMjpegPipeline,
  CliVideoPipeline,
  TcpWsPipeline
}
