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

const play = host => {
  const initialTime = window.performance.now()
  // Setup a new pipeline
  const pipeline = new pipelines.MetadataPipeline({
    ws: {
      uri: `ws://${host}/rtsp-over-websocket`,
      tokenUri: `http://${host}/axis-cgi/rtspwssession.cgi`,
      protocol: 'binary',
      timeout: 10000,
    },
    rtsp: {
      uri: `rtsp://${host}/axis-media/media.amp?event=on&video=0&audio=0`,
    },
    metadataHandler: msg => {
      const title = document.createElement('div')
      title.textContent = `+${window.performance.now() - initialTime}`
      title.classList.add('metadata-title')

      const content = document.createElement('div')
      content.textContent = new TextDecoder().decode(msg.data)
      content.classList.add('metadata-content')

      document.querySelector('#placeholder').prepend(title, content)
    },
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

  console.log(host)

  await authorize(host)

  pipeline = play(host)
})
