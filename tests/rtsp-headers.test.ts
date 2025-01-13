import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import {
  optionsResponseLowerCase,
  sdpResponse,
  sdpResponseLive555,
  setupResponse,
  setupResponseNoTimeout,
  teardownResponse,
} from './rtsp-headers.fixtures'

import {
  bodyOffset,
  parseResponse,
  parseSession,
} from '../src/streams/components/rtsp/header'

describe('sequence', (test) => {
  test('should represent an int', () => {
    assert.is(parseResponse(sdpResponse).headers.get('CSeq'), '3')
    assert.is(parseResponse(setupResponse).headers.get('CSeq'), '5')
    assert.is(parseResponse(optionsResponseLowerCase).headers.get('CSeq'), '1')
  })
})

describe('sessionId', (test) => {
  test('should be missing before SETUP', () => {
    assert.is(parseResponse(sdpResponse).headers.get('Session'), null)
  })
  test('should be present in a SETUP response', () => {
    const rsp = parseResponse(setupResponse)
    const session = rsp.headers.get('Session')
    assert.ok(session)
    assert.is(session, 'Bk48Ak7wjcWaAgRD; timeout=120')
    const { id, timeout } = parseSession(session)
    assert.is(id, 'Bk48Ak7wjcWaAgRD')
    assert.is(timeout, 120)
  })
  test('should be present in a TEARDOWN response', () => {
    assert.is(
      parseResponse(teardownResponse).headers.get('Session'),
      'ZyHdf8Mn.$epq_8Z; timeout=60'
    )
  })
})

describe('sessionTimeout', (test) => {
  test('should be missing before SETUP', () => {
    assert.is(
      parseSession(parseResponse(sdpResponse).headers.get('Session') ?? '')
        .timeout,
      undefined
    )
  })
  test('should be extracted correctly when in a SETUP response', () => {
    assert.is(
      parseSession(parseResponse(setupResponse).headers.get('Session') ?? '')
        .timeout,
      120
    )
  })
  test('should be missing when not specified in a SETUP response', () => {
    assert.is(
      parseSession(
        parseResponse(setupResponseNoTimeout).headers.get('Session') ?? ''
      ).timeout,
      undefined
    )
  })
})

describe('statusCode', (test) => {
  test('should return an integer', () => {
    assert.is(parseResponse(sdpResponseLive555).statusCode, 200)
    assert.is(parseResponse(teardownResponse).statusCode, 200)
  })
})

describe('contentBase', (test) => {
  test('should return correct contentBase', () => {
    assert.is(
      parseResponse(sdpResponse).headers.get('Content-Base'),
      'rtsp://192.168.0.3/axis-media/media.amp/'
    )
  })
  test('should return correct contentBase using live555', () => {
    assert.is(
      parseResponse(sdpResponseLive555).headers.get('Content-Base'),
      'rtsp://127.0.0.1:8554/out.svg/'
    )
  })
})

describe('connection', (test) => {
  test('should be closed in a TEARDOWN response', () => {
    assert.is(
      parseResponse(teardownResponse).headers.get('Connection'),
      'close'
    )
  })

  test('should be missing on setup', () => {
    assert.is(parseResponse(setupResponse).headers.get('Connection'), null)
  })
})

describe('bodyOffset', (test) => {
  test('should return the lowest index of all possible line breaks', () => {
    const bodyWithLinebreaks = '\r\r<svg>\r\n\r\n</svg>\n\n'
    const buf = new Uint8Array(setupResponse.length + bodyWithLinebreaks.length)
    setupResponse.split('').forEach((character, index) => {
      buf[index] = character.charCodeAt(0)
    })
    bodyWithLinebreaks.split('').forEach((character, index) => {
      buf[index + setupResponse.length] = character.charCodeAt(0)
    })
    assert.is(bodyOffset(buf), setupResponse.length)
  })
})
