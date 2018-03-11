const Pipeline = require('./pipeline')
const RtspPipeline = require('./rtsp-pipeline')
const RtspMp4Pipeline = require('./rtsp-mp4-pipeline')
const CliVideoPipeline = require('./cli-video-pipeline')
const TcpWsPipeline = require('./tcp-ws-pipeline')

module.exports = {
  Pipeline,
  RtspPipeline,
  RtspMp4Pipeline,
  CliVideoPipeline,
  TcpWsPipeline
}
