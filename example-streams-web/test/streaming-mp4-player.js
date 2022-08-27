const { pipelines } = window.mediaStreamLibrary

const play = (host) => {
  // Grab a reference to the video element
  const mediaElement = document.querySelector('video')

  // Setup a new pipeline
  const pipeline = new pipelines.HttpMsePipeline({
    http: { uri: `http://${host}/test/bbb.mp4` },
    mediaElement,
  })
  pipeline.http.play()
}

play(window.location.host)
