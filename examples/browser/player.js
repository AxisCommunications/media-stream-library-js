const {pipelines} = window.flodhast

// force auth
const authorize = async (host) => {
  // Force a login by fetching usergroup
  const fetchOptions = {
    credentials: 'include',
    headers: {
      'Axis-Orig-Sw': true,
      'X-Requested-With': 'XMLHttpRequest'
    },
    mode: 'no-cors'
  }
  try {
    await window.fetch(`http://${host}/axis-cgi/usergroup.cgi`, fetchOptions)
  } catch (err) {
    console.error(err)
  }
}

const play = (host) => {
  // Grab a reference to the video element
  const videoEl = document.querySelector('video')

  // Setup a new pipeline
  const pipeline = new pipelines.Html5VideoPipeline({
    ws: {uri: `ws://${host}/rtsp-over-websocket`},
    rtsp: {uri: `rtsp://${host}/axis-media/media.amp`},
    videoEl
  })
  pipeline.ready.then(() => {
    pipeline.play()
  })
}

// Each time a device ip is entered, authorize and then play
const device = document.querySelector('#device')
device.addEventListener('change', async (e) => {
  const host = e.target.value

  await authorize(host)
  play(host)
})
