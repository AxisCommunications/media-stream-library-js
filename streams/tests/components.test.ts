import * as assert from 'uvu/assert'

import { Sink, Source, Tube } from 'components/component'
import StreamFactory from 'components/helpers/stream-factory'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

// tests
const source = () =>
  new Source(StreamFactory.producer(), StreamFactory.consumer())
const pass = () => new Tube()
const sink = () => new Sink(StreamFactory.consumer(), StreamFactory.producer())

// Validate components.
const components = {
  source,
  pass,
  sink,
}

describe('valid component', (test) => {
  for (const [key, value] of Object.entries(components)) {
    runComponentTests(value(), key, test)
  }
})

/**
 * Components can only be connected when they have complementary
 * incoming and outgoing streams. The following tests assure that
 * the 'attach' method catches bad combinations.
 *
 * Schematic of components:
 *
 *     +-----------+                     +-----------+
 *     |           <---+                 |           <---+
 *     |           |     X               |           |
 *     |   source  |     X               |   source  |
 *     |           |     X               |           |
 *     |           +--->                 |           +--->
 *     +-----------+                     +-----------+
 *
 *     +-----------+                     +-----------+
 * <-------------------+             <-------------------+
 *     |           |     X         X     |           |
 *     |   pass    |     X         X     |   pass    |
 *     |           |     X         X     |           |
 * +------------------->             +------------------->
 *     +-----------+                     +-----------+
 *
 *     +-----------+                     +-----------+
 * <---+           |                 <---+           |
 *     |           |               X     |           |
 *     |   sink    |               X     |   sink    |
 *     |           |               X     |           |
 * +--->           |                 +--->           |
 *     +-----------+                     +-----------+
 */

const badPairs = [
  [source, source],
  [pass, source],
  [sink, source],
  [sink, pass],
  [sink, sink],
]

const goodPairs = [
  [source, pass],
  [source, sink],
  [pass, pass],
  [pass, sink],
]

describe('connect', (test) => {
  test('bad pairs should not be allowed to be connected', () => {
    for (const [srcGen, dstGen] of badPairs) {
      const src = srcGen()
      const dst = dstGen()

      assert.throws(() => src.connect(dst as any), 'connection failed')
    }
  })

  test('good pairs should be able to connect without throwing', () => {
    for (const [srcGen, dstGen] of goodPairs) {
      const src = srcGen()
      const dst = dstGen()

      assert.is(src.connect(dst as any), dst)
    }
  })

  test('null components should not break the chaining', () => {
    const src = source()
    const dst = sink()
    assert.is(src.connect(null).connect(dst), dst)
  })

  test('already connected source should not be allowed to connect', () => {
    const src = source()
    const dst1 = sink()
    const dst2 = sink()
    src.connect(dst1)
    assert.throws(() => src.connect(dst2), 'connection failed')
  })

  test('already connected destination should not be allowed to connect', () => {
    const src1 = source()
    const src2 = source()
    const dst = sink()
    src1.connect(dst)
    assert.throws(() => src2.connect(dst), 'connection failed')
  })
})

describe('disconnect', (test) => {
  test('not-connected components should be able to disconnect', () => {
    const src = source()
    assert.is(src.disconnect(), src)
  })

  test('connected components should be able to disconnect', () => {
    const src = source()
    const dst = sink()
    src.connect(dst)
    assert.is(src.disconnect(), src)
  })

  test('disconnected components should be able to reconnect', () => {
    const src = source()
    const dst = sink()
    src.connect(dst)
    src.disconnect()
    assert.is(src.connect(dst), dst)
  })
})

describe('error propagation', (test) => {
  test('errors should be propagated if connected', (ctx) => {
    const src = source()
    const dst = sink()

    // Set up spies that will be called when an error occurs
    ctx.srcIncomingError = undefined
    ctx.srcOutgoingError = undefined
    ctx.dstIncomingError = undefined
    ctx.dstOutgoingError = undefined
    const srcIncomingError = (error: unknown) => (ctx.srcIncomingError = error)
    const srcOutgoingError = (error: unknown) => (ctx.srcOutgoingError = error)
    const dstIncomingError = (error: unknown) => (ctx.dstIncomingError = error)
    const dstOutgoingError = (error: unknown) => (ctx.dstOutgoingError = error)

    // Handle all error events (jest doesn't like unhandled events)
    src.incoming.on('error', srcIncomingError)
    src.outgoing.on('error', srcOutgoingError)
    dst.incoming.on('error', dstIncomingError)
    dst.outgoing.on('error', dstOutgoingError)

    src.connect(dst)

    dst.incoming.emit('error', 'testError')
    assert.is(ctx.srcIncomingError, 'testError')

    src.outgoing.emit('error', 'testError')
    assert.is(ctx.dstOutgoingError, 'testError')
  })

  test('errors should not be propagated depending if disconnected', (ctx) => {
    const src = source()
    const dst = sink()

    // Set up spies that will be called when an error occurs
    ctx.srcIncomingError = undefined
    ctx.srcOutgoingError = undefined
    ctx.dstIncomingError = undefined
    ctx.dstOutgoingError = undefined
    const srcIncomingError = (error: unknown) => (ctx.srcIncomingError = error)
    const srcOutgoingError = (error: unknown) => (ctx.srcOutgoingError = error)
    const dstIncomingError = (error: unknown) => (ctx.dstIncomingError = error)
    const dstOutgoingError = (error: unknown) => (ctx.dstOutgoingError = error)

    // Handle all error events (jest doesn't like unhandled events)
    src.incoming.on('error', srcIncomingError)
    src.outgoing.on('error', srcOutgoingError)
    dst.incoming.on('error', dstIncomingError)
    dst.outgoing.on('error', dstOutgoingError)

    src.connect(dst)
    src.disconnect()

    dst.incoming.emit('error', 'testError')
    assert.is(ctx.srcIncomingError, undefined)

    src.outgoing.emit('error', 'testError')
    assert.is(ctx.dstOutgoingError, undefined)
  })
})
