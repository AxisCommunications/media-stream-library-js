import { fetchSdp } from '/msl-streams.min.js'

const play = (host) => {
  // Grab a reference to the video element
  const sdpDiv = document.querySelector('#sdp')

  // Setup a new pipeline
  fetchSdp({
    ws: { uri: `ws://${host}:8854/` },
    rtsp: { uri: `rtsp://localhost:8554/test` },
  })
    .then((sdp) => {
      sdpDiv.innerHTML = JSON.stringify(sdp, undefined, 2)
    })
    .catch((err) => {
      sdpDiv.innerHTML = JSON.stringify(err, undefined, 2)
    })
}

play(window.location.hostname)
