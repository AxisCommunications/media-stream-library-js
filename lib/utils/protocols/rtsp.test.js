const Rtsp = require('./rtsp')
const { sdpResponse, sdpResponseLive555, setupResponse, teardownResponse } =
  require('./fixtures')

describe('Rtsp', () => {
  describe('sequence', () => {
    it('should return an int', () => {
      expect(Rtsp.sequence(Buffer.from(sdpResponse))).toEqual(3)
      expect(Rtsp.sequence(Buffer.from(setupResponse))).toEqual(5)
    })
  })
  describe('sessionId', () => {
    it('should be a null before SETUP', () => {
      expect(Rtsp.sessionId(Buffer.from(sdpResponse))).toEqual(null)
    })
    it('should be present in a SETUP response', () => {
      expect(Rtsp.sessionId(Buffer.from(setupResponse))).toEqual('Bk48Ak7wjcWaAgRD')
    })
    it('should be present in a TEARDOWN response', () => {
      expect(Rtsp.sessionId(Buffer.from(teardownResponse))).toEqual('ZyHdf8Mn.$epq_8Z')
    })
  })

  describe('statusCode', () => {
    it('should return an integer', () => {
      expect(Rtsp.statusCode(Buffer.from(sdpResponseLive555))).toEqual(200)
      expect(Rtsp.statusCode(Buffer.from(teardownResponse))).toEqual(200)
    })
  })

  describe('contentBase', () => {
    it('should return correct contentBase', () => {
      expect(Rtsp.contentBase(Buffer.from(sdpResponse)))
        .toEqual('rtsp://192.168.0.3/axis-media/media.amp/')
    })
    it('should return correct contentBase using live555', () => {
      expect(Rtsp.contentBase(Buffer.from(sdpResponseLive555)))
        .toEqual('rtsp://127.0.0.1:8554/out.svg/')
    })
  })

  describe('connectionEnded', () => {
    it('should be true in a TEARDOWN response', () => {
      expect(Rtsp.connectionEnded(Buffer.from(teardownResponse))).toEqual(true)
    })

    it('should be false otherwise', () => {
      expect(Rtsp.connectionEnded(Buffer.from(setupResponse))).toEqual(false)
    })
  })

  describe('bodyOffset', () => {
    it('should return the lowest index of all possible line breaks', () => {
      const bodyWithLinebreaks = '\r\r<svg>\r\n\r\n</svg>\n\n'
      const buf = Buffer.alloc(setupResponse.length + bodyWithLinebreaks.length)
      setupResponse.split('').map((character, index) => { buf[index] = character.charCodeAt(0) })
      bodyWithLinebreaks.split('').map((character, index) => {
        buf[index + setupResponse.length] = character.charCodeAt(0)
      })
      expect(Rtsp.bodyOffset(buf)).toEqual(setupResponse.length)
    })
  })
})
