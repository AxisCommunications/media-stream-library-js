import { HttpMp4Pipeline } from '/msl-streams.min.js'

// force auth
const authorize = async (host) => {
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

const play = (host) => {
  // Grab a reference to the video element
  const mediaElement = document.querySelector('video')

  // Setup a new pipeline
  pipeline = new HttpMp4Pipeline({
    uri: `http://${host}/axis-cgi/media.cgi?videocodec=h264&container=mp4`,
    mediaElement,
  })
  pipeline.start().catch((err) => {
    console.error(err)
  })
  return pipeline
}

let pipeline
// Each time a device ip is entered, authorize and then play
const playButton = document.querySelector('#play')
playButton.addEventListener('click', async () => {
  pipeline && pipeline.close()

  const device = document.querySelector('#device')
  const host = device.value || device.placeholder

  await authorize(host)

  pipeline = play(host)
})

let stopCapture
const startCaptureButton = document.querySelector('#startCapture')
startCaptureButton.addEventListener('click', async () => {
  if (!pipeline) {
    console.error('No pipeline')
    return
  }

  stopCapture = await pipeline.capture((bytes) => {
    console.log('Capture finished!', bytes.byteLength)
    console.log(bytes)
  })
})

const stopCaptureButton = document.querySelector('#stopCapture')
stopCaptureButton.addEventListener('click', async () => {
  if (!stopCapture) {
    console.error('Capture not started!')
    return
  }
  stopCapture()
})
