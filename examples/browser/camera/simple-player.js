const { pipelines } = window.mediaStreamLibrary

// force auth
const authorize = async host => {
  // Force a login by fetching usergroup
  const fetchOptions = {
    credentials: 'include',
    headers: {
      'Axis-Orig-Sw': true,
      'X-Requested-With': 'XMLHttpRequest',
    },
    mode: 'no-cors',
  }
  try {
    await window.fetch(`http://${host}/axis-cgi/usergroup.cgi`, fetchOptions)
  } catch (err) {
    console.error(err)
  }
}

const play = (host, encoding = 'h264') => {
  const videoEl = document.querySelector('video')
  const canvasEl = document.querySelector('canvas')
  // Grab a reference to the video element
  let Pipeline
  let mediaElement
  if (encoding === 'h264') {
    Pipeline = pipelines.Html5VideoPipeline
    mediaElement = videoEl
    // hide the other output
    videoEl.style.display = ''
    canvasEl.style.display = 'none'
  } else {
    Pipeline = pipelines.Html5CanvasPipeline
    mediaElement = canvasEl
    // hide the other output
    videoEl.style.display = 'none'
    canvasEl.style.display = ''
  }

  // Setup a new pipeline
  const pipeline = new Pipeline({
    ws: { uri: `ws://${host}/rtsp-over-websocket` },
    rtsp: { uri: `rtsp://${host}/axis-media/media.amp?videocodec=${encoding}` },
    mediaElement,
  })
  pipeline.ready.then(() => {
    pipeline.rtsp.play()
  })

  return pipeline
}

let pipeline

// Each time a device ip is entered, authorize and then play
const playButton = document.querySelector('#play')
playButton.addEventListener('click', async e => {
  pipeline && pipeline.close()

  const device = document.querySelector('#device')
  const host = device.value || device.placeholder
  const encoding = document.querySelector('input[name=encoding]:checked').id

  console.log(host, encoding)

  await authorize(host)

  pipeline = play(host, encoding)
})
