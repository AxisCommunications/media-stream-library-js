const {pipelines} = window.mediaStreamLibrary

const play = (host) => {
  // Grab a reference to the video element
  const videoEl = document.querySelector('video')

  // Setup a new pipeline
  const pipeline = new pipelines.Html5VideoPipeline({
    ws: {uri: 'ws://localhost:8854/'},
    rtsp: {uri: 'rtsp://0.0.0.0:8554/test'},
    videoEl
  })
  pipeline.ready.then(() => {
    console.log('pipeline ready')
    pipeline.play()
  })
}

// Each time a device ip is entered, authorize and then play
play()
