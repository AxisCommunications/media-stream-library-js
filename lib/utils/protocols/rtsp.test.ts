import {
  bodyOffset,
  connectionEnded,
  contentBase,
  sequence,
  sessionId,
  statusCode,
  sessionTimeout,
} from './rtsp'

import {
  sdpResponse,
  sdpResponseLive555,
  setupResponse,
  optionsResponseLowerCase,
  teardownResponse,
  setupResponseNoTimeout,
} from './fixtures'

describe('Rtsp', () => {
  describe('sequence', () => {
    it('should return an int', () => {
      expect(sequence(Buffer.from(sdpResponse))).toEqual(3)
      expect(sequence(Buffer.from(setupResponse))).toEqual(5)
      expect(sequence(Buffer.from(optionsResponseLowerCase))).toEqual(1)
    })
  })
  describe('sessionId', () => {
    it('should be a null before SETUP', () => {
      expect(sessionId(Buffer.from(sdpResponse))).toEqual(null)
    })
    it('should be present in a SETUP response', () => {
      expect(sessionId(Buffer.from(setupResponse))).toEqual('Bk48Ak7wjcWaAgRD')
    })
    it('should be present in a TEARDOWN response', () => {
      expect(sessionId(Buffer.from(teardownResponse))).toEqual(
        'ZyHdf8Mn.$epq_8Z',
      )
    })
  })

  describe('sessionTimeout', () => {
    it('should be null before SETUP', () => {
      expect(sessionTimeout(Buffer.from(sdpResponse))).toBeNull()
    })
    it('should be extracted correctly when in a SETUP response', () => {
      expect(sessionTimeout(Buffer.from(setupResponse))).toEqual(60)
    })
    it('should be null when not specified in a SETUP response', () => {
      expect(sessionTimeout(Buffer.from(setupResponseNoTimeout))).toBeNull()
    })
  })

  describe('statusCode', () => {
    it('should return an integer', () => {
      expect(statusCode(Buffer.from(sdpResponseLive555))).toEqual(200)
      expect(statusCode(Buffer.from(teardownResponse))).toEqual(200)
    })
  })

  describe('contentBase', () => {
    it('should return correct contentBase', () => {
      expect(contentBase(Buffer.from(sdpResponse))).toEqual(
        'rtsp://192.168.0.3/axis-media/media.amp/',
      )
    })
    it('should return correct contentBase using live555', () => {
      expect(contentBase(Buffer.from(sdpResponseLive555))).toEqual(
        'rtsp://127.0.0.1:8554/out.svg/',
      )
    })
  })

  describe('connectionEnded', () => {
    it('should be true in a TEARDOWN response', () => {
      expect(connectionEnded(Buffer.from(teardownResponse))).toEqual(true)
    })

    it('should be false otherwise', () => {
      expect(connectionEnded(Buffer.from(setupResponse))).toEqual(false)
    })
  })

  describe('bodyOffset', () => {
    it('should return the lowest index of all possible line breaks', () => {
      const bodyWithLinebreaks = '\r\r<svg>\r\n\r\n</svg>\n\n'
      const buf = Buffer.alloc(setupResponse.length + bodyWithLinebreaks.length)
      setupResponse.split('').map((character, index) => {
        buf[index] = character.charCodeAt(0)
      })
      bodyWithLinebreaks.split('').map((character, index) => {
        buf[index + setupResponse.length] = character.charCodeAt(0)
      })
      expect(bodyOffset(buf)).toEqual(setupResponse.length)
    })
  })
})
