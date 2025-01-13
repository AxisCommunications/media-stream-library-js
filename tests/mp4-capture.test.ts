import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import { IsomMessage } from '../src/streams/components'
import { concat, encode } from '../src/streams/components/utils/bytes'
import {
  consumer,
  peeker,
  producer,
} from '../src/streams/components/utils/streams'
import { setupMp4Capture } from '../src/streams/mp4-capture'

// Mocks
const MOCK_BUFFER_SIZE = 100 // Jest has problems with large buffers
const MOCK_MOVIE_START = concat([new Uint8Array(4), encode('ftypisom')])
const MOCK_MOVIE_BOX1 = new Uint8Array(8).fill(0xff)
const MOCK_MOVIE_BOX2 = new Uint8Array(8).fill(0xfe)

// A movie consists of ISOM packets, starting with an ISOM message that has a
// tracks property.  We want to simulate the beginning and end of a movie, as
// well as non-movie packets.
const MOCK_MOVIE = [
  new IsomMessage({ mimeType: 'video/mp4', data: MOCK_MOVIE_START }),
  new IsomMessage({ data: MOCK_MOVIE_BOX1 }),
  new IsomMessage({ data: MOCK_MOVIE_BOX1 }),
  new IsomMessage({ data: MOCK_MOVIE_BOX1 }),
  new IsomMessage({ data: MOCK_MOVIE_BOX1 }),
] as const
const MOCK_MOVIE_DATA = concat(MOCK_MOVIE.map(({ data }) => data))

const MOCK_MOVIE_ENDING = [
  new IsomMessage({ data: MOCK_MOVIE_BOX2 }),
  new IsomMessage({ data: MOCK_MOVIE_BOX2 }),
  new IsomMessage({ data: MOCK_MOVIE_BOX2 }),
  new IsomMessage({ data: MOCK_MOVIE_BOX2 }),
] as const

// Set up a pipeline: source - capture - sink.
const pipelineFactory = (
  onMessage: (msg: IsomMessage) => void,
  ...fragments: ReadonlyArray<ReadonlyArray<IsomMessage>>
) => {
  const sourceMessages = ([] as ReadonlyArray<IsomMessage>).concat(...fragments)
  const sinkCalled = { value: 0 }
  const sinkHandler = () => {
    sinkCalled.value++
  }

  const source = producer(sourceMessages)
  const peek = peeker((msg: IsomMessage) => {
    onMessage(msg)
  })
  const sink = consumer(sinkHandler)

  const flow = () => source.pipeThrough(peek).pipeTo(sink)

  return {
    flow,
    sink,
    sinkCalled,
    source,
  }
}

describe('data copying', (test) => {
  test('captured buffer should match movie', async () => {
    let captured: Uint8Array | undefined
    const { capture, triggerEnd } = setupMp4Capture((bytes) => {
      captured = bytes
    }, MOCK_BUFFER_SIZE)
    const pipeline = pipelineFactory(capture, MOCK_MOVIE)

    // Start the pipeline (this will flow the messages)
    await pipeline.flow()

    triggerEnd()
    assert.equal(captured, MOCK_MOVIE_DATA)
  })

  test('should only occur when new movie has started', async () => {
    let captured: Uint8Array | undefined
    const { capture, triggerEnd } = setupMp4Capture((bytes) => {
      captured = bytes
    }, MOCK_BUFFER_SIZE)
    const pipeline = pipelineFactory(capture, MOCK_MOVIE_ENDING, MOCK_MOVIE)

    // Start the pipeline (this will flow the messages)
    await pipeline.flow()

    triggerEnd()
    assert.equal(captured, MOCK_MOVIE_DATA)
  })

  test('should stop when triggered', async () => {
    let captured: Uint8Array | undefined
    const { capture, triggerEnd } = setupMp4Capture((bytes) => {
      captured = bytes
    }, MOCK_BUFFER_SIZE)
    const autoEnd = (msg: IsomMessage) => {
      if (msg.data[0] === 0xfe) {
        triggerEnd()
      }
      capture(msg)
    }
    const pipeline = pipelineFactory(autoEnd, MOCK_MOVIE, MOCK_MOVIE_ENDING)

    // Start the pipeline (this will flow the messages)
    await pipeline.flow()

    assert.equal(captured, MOCK_MOVIE_DATA)
  })
})
