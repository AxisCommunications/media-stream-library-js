import { RtspJpegPipeline } from '/msl-streams.min.js'

const play = (host) => {
  // Grab a reference to the video element
  const mediaElement = document.querySelector('canvas')

  // Setup a new pipeline
  const pipeline = new RtspJpegPipeline({
    ws: { uri: `ws://${host}:8855/` },
    rtsp: { uri: `rtsp://localhost:8555/test` },
    mediaElement,
  })
  pipeline.start()
  pipeline.play()
}

play(window.location.hostname)
