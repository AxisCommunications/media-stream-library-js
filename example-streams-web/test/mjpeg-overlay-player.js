import { RtspJpegPipeline, Scheduler } from '/msl-streams.min.js'
const d3 = window.d3

const play = (host) => {
  // Grab a reference to the video element
  const mediaElement = document.querySelector('canvas')

  const svg = d3.select('svg')
  const group = svg.append('g')
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
  const y = d3.scaleLinear().domain([0, 200000]).rangeRound([svgHeight, 0])
  const line = d3
    .line()
    .x((d, i) => x(i))
    .y((d) => y(d))
    .curve(d3.curveStep)

  // Create a function that will be used to draw the data
  const data = []
  const draw = (msg) => {
    const bits = 8 * msg.data.length
    data.push(bits)
    if (data.length > 60) {
      data.shift()
      window.requestAnimationFrame(() => path.attr('d', line(data)))
    }
  }

  // Setup a new pipeline
  const pipeline = new RtspJpegPipeline({
    ws: { uri: `ws://${host}:8855/` },
    rtsp: { uri: `rtsp://localhost:8555/test` },
    mediaElement,
  })

  // Create a scheduler and insert it into the pipeline with
  // a peek component, which will call the run method of the
  // scheduler every time a message passes on the pipeline.
  const scheduler = new Scheduler(pipeline, draw)
  pipeline.rtp.peek(['jpeg'], (msg) => scheduler.run(msg))

  // When we now the UNIX time of the start of the presentation,
  // initialize the scheduler with it.
  pipeline.videoStartTime.then((ntpPresentationTime) => {
    scheduler.init(ntpPresentationTime)
  })

  pipeline.start()
  pipeline.play()
}

play(window.location.hostname)
