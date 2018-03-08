const {optionsRequest} = require('./fixtures')
const builder = require('./builder')
const {RAW, RTSP} = require('../messageTypes')

describe('RtspParser builder', () => {
  let callback, encoding

  beforeEach(() => {
    callback = jest.fn()
    encoding = null
  })

  it('ignores unknown messages', () => {
    const msg = {type: 'unknown'}
    builder(msg, encoding, callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0]).toEqual(null)
    expect(callback.mock.calls[0][1]).toEqual(msg)
  })

  it('builds a valid RTSP message from the passed in data', () => {
    const msg = {
      type: RTSP,
      method: 'OPTIONS',
      uri: 'rtsp://192.168.0.3/axis-media/media.amp?resolution=176x144&fps=1',
      headers: {
        'CSeq': '1',
        'Date': 'Wed, 03 Jun 2015 14:26:16 GMT'
      }
    }
    builder(msg, encoding, callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0]).toEqual(null)
    const outMsg = callback.mock.calls[0][1]
    expect(outMsg.type).toEqual(RAW)
    expect(outMsg.data.toString('ascii')).toEqual(optionsRequest)
  })
})
