const { pipelines } = window.mediaStreamLibrary

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

let pipeline
const play = (host) => {
  // Grab a reference to the video element
  const mediaElement = document.querySelector('video')

  // Setup a new pipeline
  pipeline = new pipelines.HttpMsePipeline({
    http: {
      uri: `http://${host}/axis-cgi/media.cgi?videocodec=h264&container=mp4`,
    },
    mediaElement,
  })
  pipeline.http.play()
}

// Each time a device ip is entered, authorize and then play
const playButton = document.querySelector('#play')
playButton.addEventListener('click', async (e) => {
  pipeline && pipeline.close()

  const host = window.location.host

  await authorize(host)

  pipeline = play(host)
})
