import { Test } from 'uvu'
import * as assert from 'uvu/assert'

/**
 * Tests for validating generic component properties.
 * These should be run for each derived Component.
 * @param  component - The component instance to test.
 * @param  name - A name for the component.
 */

// biome-ignore lint/suspicious/noExportsInTest: this file isn't included in tests
export const runComponentTests = (component: any, name = '', test: Test) => {
  test(`${name} should have incoming/outgoing stream`, () => {
    assert.is.not(component.incoming, undefined)
    assert.is.not(component.outgoing, undefined)
  })

  test(`${name} should have complementary streams`, () => {
    assert.equal(component.incoming.readable, component.outgoing.writable)
    assert.equal(component.incoming.writable, component.outgoing.readable)
  })

  test(`${name} should have objectMode on all streams`, () => {
    const incoming = component.incoming
    const outgoing = component.outgoing
    incoming.ReadableState && assert.ok(incoming.ReadableState.objectMode)
    incoming.WritableState && assert.ok(incoming.WritableState.objectMode)
    outgoing.ReadableState && assert.ok(outgoing.ReadableState.objectMode)
    outgoing.WritableState && assert.ok(outgoing.WritableState.objectMode)
  })
}
