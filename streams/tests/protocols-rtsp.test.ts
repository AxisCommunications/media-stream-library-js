import * as assert from 'uvu/assert'

import {
  bodyOffset,
  connectionEnded,
  contentBase,
  sequence,
  sessionId,
  sessionTimeout,
  statusCode,
} from 'utils/protocols/rtsp'

import {
  optionsResponseLowerCase,
  sdpResponse,
  sdpResponseLive555,
  setupResponse,
  setupResponseNoTimeout,
  teardownResponse,
} from './protocols.fixtures'
import { describe } from './uvu-describe'

describe('sequence', (test) => {
  test('should return an int', () => {
    assert.is(sequence(Buffer.from(sdpResponse)), 3)
    assert.is(sequence(Buffer.from(setupResponse)), 5)
    assert.is(sequence(Buffer.from(optionsResponseLowerCase)), 1)
  })
})

describe('sessionId', (test) => {
  test('should be a null before SETUP', () => {
    assert.is(sessionId(Buffer.from(sdpResponse)), null)
  })
  test('should be present in a SETUP response', () => {
    assert.is(sessionId(Buffer.from(setupResponse)), 'Bk48Ak7wjcWaAgRD')
  })
  test('should be present in a TEARDOWN response', () => {
    assert.is(sessionId(Buffer.from(teardownResponse)), 'ZyHdf8Mn.$epq_8Z')
  })
})

describe('sessionTimeout', (test) => {
  test('should be null before SETUP', () => {
    assert.is(sessionTimeout(Buffer.from(sdpResponse)), null)
  })
  test('should be extracted correctly when in a SETUP response', () => {
    assert.is(sessionTimeout(Buffer.from(setupResponse)), 120)
  })
  test('should be 60 when not specified in a SETUP response', () => {
    assert.is(sessionTimeout(Buffer.from(setupResponseNoTimeout)), 60)
  })
})

describe('statusCode', (test) => {
  test('should return an integer', () => {
    assert.is(statusCode(Buffer.from(sdpResponseLive555)), 200)
    assert.is(statusCode(Buffer.from(teardownResponse)), 200)
  })
})

describe('contentBase', (test) => {
  test('should return correct contentBase', () => {
    assert.is(
      contentBase(Buffer.from(sdpResponse)),
      'rtsp://192.168.0.3/axis-media/media.amp/'
    )
  })
  test('should return correct contentBase using live555', () => {
    assert.is(
      contentBase(Buffer.from(sdpResponseLive555)),
      'rtsp://127.0.0.1:8554/out.svg/'
    )
  })
})

describe('connectionEnded', (test) => {
  test('should be true in a TEARDOWN response', () => {
    assert.is(connectionEnded(Buffer.from(teardownResponse)), true)
  })

  test('should be false otherwise', () => {
    assert.is(connectionEnded(Buffer.from(setupResponse)), false)
  })
})

describe('bodyOffset', (test) => {
  test('should return the lowest index of all possible line breaks', () => {
    const bodyWithLinebreaks = '\r\r<svg>\r\n\r\n</svg>\n\n'
    const buf = Buffer.alloc(setupResponse.length + bodyWithLinebreaks.length)
    setupResponse.split('').forEach((character, index) => {
      buf[index] = character.charCodeAt(0)
    })
    bodyWithLinebreaks.split('').forEach((character, index) => {
      buf[index + setupResponse.length] = character.charCodeAt(0)
    })
    assert.is(bodyOffset(buf), setupResponse.length)
  })
})
