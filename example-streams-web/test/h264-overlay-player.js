const { components, pipelines, utils } = window.mediaStreamLibrary
const d3 = window.d3

const play = (host) => {
  // Grab a reference to the video element
  const mediaElement = document.querySelector('video')

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
  const y = d3.scaleLinear().domain([0, 150000]).rangeRound([svgHeight, 0])
  const line = d3
    .line()
    .x((d, i) => x(i))
    .y((d) => y(d))
    .curve(d3.curveStep)

  svg
    .append('g')
    .call(d3.axisRight(y))
    .style('transform', `translateX(${svgWidth}px)`)

  // Create a function that will be used to draw the data
  const data = []
  const draw = (msg) => {
    data.push(msg.data.length)
    if (data.length > 60) {
      data.shift()
      window.requestAnimationFrame(() => path.attr('d', line(data)))
    }
  }

  // Setup a new pipeline
  const pipeline = new pipelines.Html5VideoPipeline({
    ws: { uri: `ws://${host}:8854/` },
    rtsp: { uri: `rtsp://localhost:8554/test` },
    mediaElement,
  })

  // Create a scheduler and insert it into the pipeline with
  // a peek component, which will call the run method of the
  // scheduler every time a message passes on the pipeline.
  const scheduler = new utils.Scheduler(pipeline, draw)
  const runScheduler = components.Tube.fromHandlers((msg) => scheduler.run(msg))
  pipeline.insertBefore(pipeline.lastComponent, runScheduler)

  // When we now the UNIX time of the start of the presentation,
  // initialize the scheduler with it.
  pipeline.onSync = (ntpPresentationTime) => {
    scheduler.init(ntpPresentationTime)
  }

  pipeline.ready.then(() => {
    pipeline.rtsp.play()
  })
}

play(window.location.hostname)
