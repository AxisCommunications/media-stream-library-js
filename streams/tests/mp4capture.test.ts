import * as assert from 'uvu/assert'

import { Sink, Source } from 'components/component'
import { GenericMessage, MessageType } from 'components/message'
import { Mp4Capture } from 'components/mp4capture'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

// Mocks
const MOCK_BUFFER_SIZE = 10 // Jest has problems with large buffers
const MOCK_MOVIE_DATA = 0xff
const MOCK_MOVIE_ENDING_DATA = 0xfe

// FIXME: remove and use GenericMessage when it's data is Uint8Array
interface MockMessage {
  readonly type: MessageType
  readonly data: any
  ntpTimestamp?: number
}

// A movie consists of ISOM packets, starting with an ISOM message that has a
// tracks property.  We want to simulate the beginning and end of a movie, as
// well as non-movie packets.
const MOCK_MOVIE = [MessageType.ISOM, MessageType.ISOM].map((type, idx) => {
  if (idx === 0) {
    return {
      type,
      tracks: [],
      data: new Uint8Array(1).fill(MOCK_MOVIE_DATA),
    }
  }
  return { type, data: new Uint8Array(1).fill(MOCK_MOVIE_DATA) }
})
const MOCK_MOVIE_BUFFER = new Uint8Array(2).fill(MOCK_MOVIE_DATA)

const MOCK_MOVIE_ENDING = [
  MessageType.ISOM,
  MessageType.ISOM,
  MessageType.ISOM,
  MessageType.ISOM,
].map((type) => {
  return { type, data: new Uint8Array(1).fill(MOCK_MOVIE_ENDING_DATA) }
})

const MOCK_NOT_MOVIE = ['', ''].map((type) => {
  return {
    type: type as unknown as MessageType, // Intentionally bad type for testing
    data: new Uint8Array(1).fill(0),
  }
})

/**
 * Set up a pipeline: source - capture - sink.
 * @param  fragments - Messages to send from source.
 * @return Components and function to start flow.
 */
const pipelineFactory = (
  ...fragments: ReadonlyArray<ReadonlyArray<MockMessage>>
) => {
  const sourceMessages = ([] as ReadonlyArray<MockMessage>).concat(...fragments)
  const sinkCalled = { value: 0 }
  const sinkHandler = () => {
    sinkCalled.value++
  }

  const source = Source.fromMessages(sourceMessages)
  const capture = new Mp4Capture(MOCK_BUFFER_SIZE)
  const sink = Sink.fromHandler(sinkHandler)

  return {
    source,
    capture,
    sink,
    sinkCalled,
    flow: () => source.connect(capture).connect(sink),
  }
}

// Tests
describe('it should follow standard component rules', (test) => {
  const mp4capture = new Mp4Capture()
  runComponentTests(mp4capture, 'mp4capture component', test)
})

describe('data copying', (test) => {
  test('should not occur when capture inactive', async (ctx) => {
    const pipeline = pipelineFactory(MOCK_MOVIE)

    // Start the pipeline (this will flow the messages)
    pipeline.flow()

    const done = new Promise((resolve) => (ctx.resolve = resolve))
    pipeline.sink.incoming.on('finish', () => {
      assert.is(pipeline.sinkCalled.value, MOCK_MOVIE.length)
      // @ts-ignore _bufferOffset is private but we want to check nothing was captured
      assert.is(pipeline.capture._bufferOffset, 0)
      ctx.resolve()
    })
    await done
  })

  test('should occur when capture active', async (ctx) => {
    const pipeline = pipelineFactory(MOCK_MOVIE)

    // Activate capture.
    let capturedBuffer: Uint8Array
    const captureHandler = (buffer: Uint8Array) => {
      capturedBuffer = buffer
    }
    pipeline.capture.start(captureHandler)

    // Start the pipeline (this will flow the messages)
    pipeline.flow()

    const done = new Promise((resolve) => (ctx.resolve = resolve))
    pipeline.sink.incoming.on('finish', () => {
      assert.equal(capturedBuffer, MOCK_MOVIE_BUFFER)
      ctx.resolve()
    })
    await done
  })

  test('should only occur when new movie has started', async (ctx) => {
    const pipeline = pipelineFactory(MOCK_MOVIE_ENDING, MOCK_MOVIE)

    // Activate capture.
    let capturedBuffer: Uint8Array
    const captureHandler = (buffer: Uint8Array) => {
      capturedBuffer = buffer
    }
    pipeline.capture.start(captureHandler)

    // Start the pipeline (this will flow the messages)
    pipeline.flow()

    const done = new Promise((resolve) => (ctx.resolve = resolve))
    pipeline.sink.incoming.on('finish', () => {
      assert.equal(capturedBuffer, MOCK_MOVIE_BUFFER)
      ctx.resolve()
    })
    await done
  })

  test('should not occur when not a movie', async (ctx) => {
    const pipeline = pipelineFactory(MOCK_MOVIE, MOCK_NOT_MOVIE)

    // Activate capture.
    let capturedBuffer: Uint8Array
    const captureHandler = (buffer: Uint8Array) => {
      capturedBuffer = buffer
    }
    pipeline.capture.start(captureHandler)

    // Start the pipeline (this will flow the messages)
    pipeline.flow()

    const done = new Promise((resolve) => (ctx.resolve = resolve))
    pipeline.sink.incoming.on('finish', () => {
      assert.equal(capturedBuffer, MOCK_MOVIE_BUFFER)
      ctx.resolve()
    })
    await done
  })

  test('should stop when requested', async (ctx) => {
    const pipeline = pipelineFactory(MOCK_MOVIE, MOCK_MOVIE_ENDING)

    // Activate capture.
    let capturedBuffer: Uint8Array
    const captureHandler = (buffer: Uint8Array) => {
      capturedBuffer = buffer
    }
    pipeline.capture.start(captureHandler)
    pipeline.source.incoming.on('data', (msg) => {
      if (msg.data[0] === 0xfe) {
        pipeline.capture.stop()
      }
    })

    // Start the pipeline (this will flow the messages)
    pipeline.flow()

    const done = new Promise((resolve) => (ctx.resolve = resolve))
    pipeline.sink.incoming.on('finish', () => {
      assert.equal(capturedBuffer, MOCK_MOVIE_BUFFER)
      ctx.resolve()
    })
    await done
  })
})
