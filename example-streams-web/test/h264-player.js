const { RtspMp4Pipeline } = window.mediaStreamLibrary

const play = (host) => {
  // Grab a reference to the video element
  const mediaElement = document.querySelector('video')

  // Setup a new pipeline
  const pipeline = new RtspMp4Pipeline({
    ws: { uri: `ws://${host}:8854/` },
    rtsp: { uri: `rtsp://localhost:8554/test` },
    mediaElement,
  })

  pipeline.onSourceOpen = (mse) => {
    // Setting a duration of zero seems to force lower latency
    // on Firefox, and doesn't seem to affect Chromium.
    mse.duration = 0
  }

  pipeline.start()
}

play(window.location.hostname)
