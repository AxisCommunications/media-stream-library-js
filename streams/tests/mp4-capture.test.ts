import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import EventEmitter from 'node:events'

import { IsomMessage, Mp4Capture } from '../src/components'
import { consumer, peeker, producer } from '../src/components/utils/streams'

// Mocks
const MOCK_BUFFER_SIZE = 10 // Jest has problems with large buffers
const MOCK_MOVIE_DATA = 0xff
const MOCK_MOVIE_ENDING_DATA = 0xfe

// A movie consists of ISOM packets, starting with an ISOM message that has a
// tracks property.  We want to simulate the beginning and end of a movie, as
// well as non-movie packets.
const MOCK_MOVIE = [
  new IsomMessage({
    mimeType: 'video/mp4',
    data: new Uint8Array(1).fill(MOCK_MOVIE_DATA),
  }),
  new IsomMessage({ data: new Uint8Array(1).fill(MOCK_MOVIE_DATA) }),
] as const
const MOCK_MOVIE_BUFFER = new Uint8Array(2).fill(MOCK_MOVIE_DATA)

const MOCK_MOVIE_ENDING = [
  new IsomMessage({ data: new Uint8Array(1).fill(MOCK_MOVIE_ENDING_DATA) }),
  new IsomMessage({ data: new Uint8Array(1).fill(MOCK_MOVIE_ENDING_DATA) }),
  new IsomMessage({ data: new Uint8Array(1).fill(MOCK_MOVIE_ENDING_DATA) }),
  new IsomMessage({ data: new Uint8Array(1).fill(MOCK_MOVIE_ENDING_DATA) }),
] as const

// Set up a pipeline: source - capture - sink.
const pipelineFactory = (
  ...fragments: ReadonlyArray<ReadonlyArray<IsomMessage>>
) => {
  const sourceMessages = ([] as ReadonlyArray<IsomMessage>).concat(...fragments)
  const sinkCalled = { value: 0 }
  const sinkHandler = () => {
    sinkCalled.value++
  }

  const broadcast = new EventEmitter()

  const source = producer(sourceMessages)
  const peek = peeker((msg: IsomMessage) => {
    console.log('message', msg)
    broadcast.emit('message', msg)
  })
  const capture = new Mp4Capture(MOCK_BUFFER_SIZE)
  const sink = consumer(sinkHandler)

  const flow = () => source.pipeThrough(peek).pipeThrough(capture).pipeTo(sink)

  return {
    broadcast,
    source,
    capture,
    sink,
    sinkCalled,
    flow,
  }
}

describe('data copying', (test) => {
  test('should not occur when capture inactive', async () => {
    const pipeline = pipelineFactory(MOCK_MOVIE)

    // Start the pipeline (this will flow the messages)
    await pipeline.flow()

    assert.is(pipeline.sinkCalled.value, MOCK_MOVIE.length)
    // @ts-ignore access private property
    assert.is(pipeline.capture.bufferOffset, 0)
  })

  test('should occur when capture active', async () => {
    const pipeline = pipelineFactory(MOCK_MOVIE)

    // Activate capture.
    let capturedBuffer = new Uint8Array(0)
    const captureHandler = (buffer: Uint8Array) => {
      capturedBuffer = buffer
    }
    pipeline.capture.start(captureHandler)

    // Start the pipeline (this will flow the messages)
    await pipeline.flow()

    assert.equal(capturedBuffer, MOCK_MOVIE_BUFFER)
  })

  test('should only occur when new movie has started', async () => {
    const pipeline = pipelineFactory(MOCK_MOVIE_ENDING, MOCK_MOVIE)

    // Activate capture.
    let capturedBuffer = new Uint8Array(0)
    const captureHandler = (buffer: Uint8Array) => {
      capturedBuffer = buffer
    }
    pipeline.capture.start(captureHandler)

    // Start the pipeline (this will flow the messages)
    await pipeline.flow()

    assert.equal(capturedBuffer, MOCK_MOVIE_BUFFER)
  })

  test('should stop when requested', async () => {
    const pipeline = pipelineFactory(MOCK_MOVIE, MOCK_MOVIE_ENDING)

    // Activate capture.
    let capturedBuffer = new Uint8Array(0)
    const captureHandler = (buffer: Uint8Array) => {
      capturedBuffer = buffer
    }
    pipeline.capture.start(captureHandler)
    pipeline.broadcast.on('message', (msg) => {
      if (msg.data[0] === 0xfe) {
        pipeline.capture.stop()
      }
    })

    // Start the pipeline (this will flow the messages)
    await pipeline.flow()

    assert.equal(capturedBuffer, MOCK_MOVIE_BUFFER)
  })
})
