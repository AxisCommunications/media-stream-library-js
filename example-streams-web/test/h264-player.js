const { pipelines } = window.mediaStreamLibrary

const play = (host) => {
  // Grab a reference to the video element
  const mediaElement = document.querySelector('video')

  console.warn('HI', host)

  // Setup a new pipeline
  const pipeline = new pipelines.Html5VideoPipeline({
    ws: { uri: `ws://${host}:8854/` },
    rtsp: { uri: `rtsp://localhost:8554/test` },
    mediaElement,
  })
  pipeline.ready.then(() => {
    pipeline.rtsp.play()
  })
  pipeline.onSourceOpen = (mse) => {
    // Setting a duration of zero seems to force lower latency
    // on Firefox, and doesn't seem to affect Chromium.
    mse.duration = 0
  }
}

play(window.location.hostname)
