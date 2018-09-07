// internal classes
const Mp4CaptureComponent = require('./')

// Base component
const Component = require('../component')
const { ISOM, SDP } = require('../messageTypes')

// Test utilities
const validateComponent = require('../../utils/validate-component')

// Mocks
const MOCK_BUFFER_SIZE = 10 // Jest has problems with large buffers
const MOCK_MOVIE_DATA = 0xff
const MOCK_MOVIE_ENDING_DATA = 0xfe

// A movie consists of ISOM packets, starting with an SDP packet.
// We want to simulate the beginning and end of a movie, as well
// as non-movie packets.
const MOCK_MOVIE = [
  SDP, ISOM, ISOM
].map((type) => {
  return { type, data: Buffer.allocUnsafe(1).fill(MOCK_MOVIE_DATA) }
})
const MOCK_MOVIE_BUFFER = Buffer.alloc(2).fill(MOCK_MOVIE_DATA)

const MOCK_MOVIE_ENDING = [
  ISOM, ISOM, ISOM, ISOM
].map((type) => {
  return { type, data: Buffer.allocUnsafe(1).fill(MOCK_MOVIE_ENDING_DATA) }
})

const MOCK_NOT_MOVIE = [
  '', ''
].map((type) => {
  return { type, data: Buffer.allocUnsafe(1).fill(0) }
})

const copySpies = (type, messages) => {
  return messages.filter((msg) => msg.type === type).map((msg) => jest.spyOn(msg.data, 'copy'))
}

/**
 * Set up a pipeline: source - capture - sink.
 * @param  {Array} fragments Messages to send from source.
 * @return {Object} Components and function to start flow.
 */
const pipelineFactory = (...fragments) => {
  const sourceMessages = [].concat(...fragments, null)
  const sinkHandler = jest.fn()

  const source = Component.source(sourceMessages)
  const capture = new Mp4CaptureComponent(MOCK_BUFFER_SIZE)
  const sink = Component.sink(sinkHandler)

  return {
    source,
    capture,
    sink,
    sinkHandler,
    flow: () => source.connect(capture).connect(sink)
  }
}

// Tests
describe('it should follow standard component rules', () => {
  const mp4capture = new Mp4CaptureComponent()
  validateComponent(mp4capture, 'mp4capture component')
})

describe('data copying', () => {
  test('should not occur when capture inactive', (done) => {
    const pipeline = pipelineFactory(MOCK_MOVIE)

    // Spy on the copy method of the underlying movie data.
    const shouldNotCopy = copySpies(ISOM, MOCK_MOVIE)

    // Start the pipeline (this will flow the messages)
    pipeline.flow()

    pipeline.sink.incoming.on('finish', () => {
      shouldNotCopy.forEach((copy) => expect(copy).not.toHaveBeenCalled())
      expect(pipeline.sinkHandler.mock.calls.length).toBe(MOCK_MOVIE.length)
      done()
    })
  })

  test('should occur when capture active', (done) => {
    const pipeline = pipelineFactory(MOCK_MOVIE)

    // Spy on the copy method of the underlying movie data.
    const shouldCopy = copySpies(ISOM, MOCK_MOVIE)

    // Activate capture.
    const captureHandler = jest.fn()
    pipeline.capture.start(captureHandler)

    // Start the pipeline (this will flow the messages)
    pipeline.flow()

    pipeline.sink.incoming.on('finish', () => {
      shouldCopy.forEach((copy) => expect(copy).toHaveBeenCalled())
      expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER)
      done()
    })
  })

  test('should only occur when new movie has started', (done) => {
    const pipeline = pipelineFactory(MOCK_MOVIE_ENDING, MOCK_MOVIE)

    const shouldNotCopy = copySpies(ISOM, MOCK_MOVIE_ENDING)
    const shouldCopy = copySpies(ISOM, MOCK_MOVIE)

    // Activate capture.
    const captureHandler = jest.fn()
    pipeline.capture.start(captureHandler)

    // Start the pipeline (this will flow the messages)
    pipeline.flow()

    pipeline.sink.incoming.on('finish', () => {
      shouldNotCopy.forEach((copy) => expect(copy).not.toHaveBeenCalled())
      shouldCopy.forEach((copy) => expect(copy).toHaveBeenCalled())
      expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER)
      done()
    })
  })

  test('should not occur when not a movie', (done) => {
    const pipeline = pipelineFactory(MOCK_MOVIE, MOCK_NOT_MOVIE)

    const shouldCopy = copySpies(ISOM, MOCK_MOVIE)
    const shouldNotCopy = copySpies(ISOM, MOCK_NOT_MOVIE)

    // Activate capture.
    const captureHandler = jest.fn()
    pipeline.capture.start(captureHandler)

    // Start the pipeline (this will flow the messages)
    pipeline.flow()

    pipeline.sink.incoming.on('finish', () => {
      shouldCopy.forEach((copy) => expect(copy).toHaveBeenCalled())
      shouldNotCopy.forEach((copy) => expect(copy).not.toHaveBeenCalled())
      expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER)
      done()
    })
  })

  test('should stop when requested', (done) => {
    const pipeline = pipelineFactory(MOCK_MOVIE, MOCK_MOVIE_ENDING)

    const shouldCopy = copySpies(ISOM, MOCK_MOVIE)
    const shouldNotCopy = copySpies(ISOM, MOCK_NOT_MOVIE)

    // Activate capture.
    const captureHandler = jest.fn()
    pipeline.capture.start(captureHandler)
    pipeline.source.incoming.on('data', (msg) => {
      if (msg.data[0] === 0xfe) {
        pipeline.capture.stop()
      }
    })

    // Start the pipeline (this will flow the messages)
    pipeline.flow()

    pipeline.sink.incoming.on('finish', () => {
      shouldCopy.forEach((copy) => expect(copy).toHaveBeenCalled())
      shouldNotCopy.forEach((copy) => expect(copy).not.toHaveBeenCalled())
      expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER)
      done()
    })
  })
})
