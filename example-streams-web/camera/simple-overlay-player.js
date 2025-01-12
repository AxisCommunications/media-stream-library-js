import {
  RtspJpegPipeline,
  RtspMp4Pipeline,
  Scheduler,
} from '/msl-streams.min.js'
const d3 = window.d3

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

let data = []
let group

const play = (host, encoding) => {
  // Set up
  const videoEl = document.querySelector('video')
  const canvasEl = document.querySelector('canvas')
  // Grab a reference to the video element
  let Pipeline
  let mediaElement
  if (encoding === 'h264') {
    Pipeline = RtspMp4Pipeline
    mediaElement = videoEl
    // hide the other output
    videoEl.style.display = ''
    canvasEl.style.display = 'none'
  } else {
    Pipeline = RtspJpegPipeline
    mediaElement = canvasEl
    // hide the other output
    videoEl.style.display = 'none'
    canvasEl.style.display = ''
  }

  // Setup a new pipeline
  const pipeline = new Pipeline({
    ws: {
      uri: `ws://${host}/rtsp-over-websocket`,
      tokenUri: `http://${host}/rtspwssession.cgi`,
    },
    rtsp: { uri: `rtsp://${host}/axis-media/media.amp?videocodec=${encoding}` },
    mediaElement,
  })

  const svg = d3.select('svg')
  group = svg.append('g')
  const path = group
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', '#fc3')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('stroke-width', 1.5)
  const { width: svgWidth, height: svgHeight } = svg
    .node()
    .getBoundingClientRect()

  const x = d3.scaleLinear().domain([0, 59]).rangeRound([0, svgWidth])
  let maxBytes = 0
  let y = d3.scaleLinear().domain([0, maxBytes]).rangeRound([svgHeight, 0])
  const line = d3
    .line()
    .x((d, i) => x(i))
    .y((d) => y(d))
    .curve(d3.curveStep)

  const draw = (msg) => {
    data.push(msg.data.length)
    if (maxBytes < msg.data.length - 100) {
      maxBytes = 2 * msg.data.length
      y = d3.scaleLinear().domain([0, maxBytes]).rangeRound([svgHeight, 0])
    }
    if (data.length > 60) {
      data.shift()
      window.requestAnimationFrame(() => path.attr('d', line(data)))
    }
    // console.log('sync', new Date(msg.ntpTimestamp), msg.data.length)
  }

  // Create a scheduler and insert it into the pipeline with
  // a peek component, which will call the run method of the
  // scheduler every time a message passes on the pipeline.
  const scheduler = new Scheduler(pipeline, draw)
  pipeline.rtp.peek([encoding], (msg) => scheduler.run(msg))

  // When we now the UNIX time of the start of the presentation,
  // initialize the scheduler with it.
  pipeline.videoStartTime.then((ntpPresentationTime) => {
    scheduler.init(ntpPresentationTime)
  })

  pipeline.start().catch((err) => {
    console.error(err)
  })

  pipeline.play()

  return pipeline
}

let pipeline

// Each time a device ip is entered, authorize and then play
const playButton = document.querySelector('#play')
playButton.addEventListener('click', async () => {
  pipeline && pipeline.close()
  group && group.remove()
  data = []

  const device = document.querySelector('#device')
  const host = device.value || device.placeholder
  const encoding = document.querySelector('input[name=encoding]:checked').id

  console.log(host, encoding)

  await authorize(host)

  pipeline = play(host, encoding)
})
