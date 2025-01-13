import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import { rtpBuffers, rtpBuffersWithHeaderExt } from './rtsp-rtp.fixtures'

import {
  cSrc,
  cSrcCount,
  extHeader,
  extension,
  marker,
  padding,
  payload,
  payloadType,
  sSrc,
  sequenceNumber,
  timestamp,
  version,
} from '../src/streams/components/rtsp/rtp'

describe('Rtp parsing', (test) => {
  for (const buffer of rtpBuffers) {
    test('is parsed correctly', () => {
      assert.is(version(buffer), 2)
      assert.is(padding(buffer), false)
      assert.is(extension(buffer), false)
      assert.is(sSrc(buffer), 431929961)
    })
  }

  for (const buffer of rtpBuffersWithHeaderExt) {
    test('is parsed correctly', () => {
      assert.is(version(buffer), 2)
      assert.is(padding(buffer), false)
      assert.is(extension(buffer), true)
      assert.is(sSrc(buffer), 431929961)
    })
  }

  test('should expose correct cSrcCount', () => {
    assert.is(cSrcCount(rtpBuffers[0]), 0)
    assert.is(cSrcCount(rtpBuffers[1]), 0)
    assert.is(cSrcCount(rtpBuffers[2]), 1)
  })

  test('should expose correct cSrc', () => {
    assert.is(cSrc(rtpBuffers[0]), 0)
    assert.is(cSrc(rtpBuffers[1]), 0)
    assert.is(cSrc(rtpBuffers[2]), 1)
  })

  test('should have the correct timestamps', () => {
    assert.is(timestamp(rtpBuffers[0]), 3777434756)
    assert.is(timestamp(rtpBuffers[1]), 3777457249)
    assert.is(timestamp(rtpBuffers[2]), 3777509736)
  })

  test('should have the correct sequence number', () => {
    assert.is(sequenceNumber(rtpBuffers[0]), 20536)
    assert.is(sequenceNumber(rtpBuffers[1]), 20556)
    assert.is(sequenceNumber(rtpBuffers[2]), 20575)
  })

  test('should have the correct Payload Type & Marker Flags', () => {
    assert.is(marker(rtpBuffers[0]), false)
    assert.is(marker(rtpBuffers[1]), true)
    assert.is(marker(rtpBuffers[2]), true)
    assert.is(payloadType(rtpBuffers[0]), 96)
    assert.is(payloadType(rtpBuffers[1]), 96)
    assert.is(payloadType(rtpBuffers[2]), 96)
  })

  test('should expose the payload', () => {
    assert.equal(payload(rtpBuffers[0]), new Uint8Array(0))
    assert.equal(payload(rtpBuffers[1]), new Uint8Array([1, 2, 3]))
    assert.equal(payload(rtpBuffers[2]), new Uint8Array([1, 2, 3]))
    assert.equal(payload(rtpBuffersWithHeaderExt[0]), new Uint8Array([1, 2, 3]))
    assert.equal(payload(rtpBuffersWithHeaderExt[1]), new Uint8Array([1, 2, 3]))
  })

  test('should expose the extension header', () => {
    assert.equal(extHeader(rtpBuffers[0]), new Uint8Array(0))
    assert.equal(extHeader(rtpBuffers[1]), new Uint8Array(0))
    assert.equal(extHeader(rtpBuffers[2]), new Uint8Array(0))
    assert.equal(extHeader(rtpBuffersWithHeaderExt[0]), new Uint8Array(0))
    assert.equal(
      extHeader(rtpBuffersWithHeaderExt[1]),
      new Uint8Array([1, 2, 0, 1, 1, 2, 3, 4])
    )
  })
})
