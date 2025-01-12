import { HttpMp4Pipeline } from '/msl-streams.min.js'

const play = (host) => {
  // Grab a reference to the video element
  const mediaElement = document.querySelector('video')

  // Setup a new pipeline
  const pipeline = new HttpMp4Pipeline({
    uri: `http://${host}/test/bbb.mp4`,
    mediaElement,
  })

  pipeline.start()
}

play(window.location.host)
