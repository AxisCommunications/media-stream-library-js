import { RtspMp4Pipeline } from '/msl-streams.min.js'

const play = (host) => {
  // Grab a reference to the video element
  const mediaElement = document.querySelector('video')

  // Setup a new pipeline
  const pipeline = new RtspMp4Pipeline({
    ws: { uri: `ws://${host}:8854/` },
    rtsp: { uri: `rtsp://localhost:8554/test` },
    mediaElement,
  })

  pipeline.mse.mediaSource.addEventListener(
    'sourceopen',
    () => {
      // Setting a duration of zero seems to force lower latency
      // on Firefox, and doesn't seem to affect Chromium.
      pipeline.mse.mediaSource.duration = 0
    },
    { once: true }
  )

  pipeline.start()
}

play(window.location.hostname)
