const { RAW, RTSP } = require('../messageTypes')
const debug = require('debug')
const DEFAULT_PROTOCOL = 'RTSP/1.0'

const objToArr = function (obj) {
  const arr = []
  Object.keys(obj).forEach((key) => {
    arr.push(key + ': ' + obj[key])
  })
  return arr
}

const buildRtsp = (msg, encoding, callback) => {
  if (msg.type === RTSP) {
    if (!msg.method || !msg.uri) {
      throw new Error('message needs to contain a method and a uri')
    }
    const protocol = msg.protocol || DEFAULT_PROTOCOL
    const headers = msg.headers || {}

    const messageString = [`${msg.method} ${msg.uri} ${protocol}`,
      objToArr(headers).join('\r\n'),
      '\r\n'
    ].join('\r\n')
    debug('msl:rtsp:outgoing')(messageString)

    const data = Buffer.from(messageString)
    callback(null, { type: RAW, data })
  } else {
    // don't touch other types
    callback(null, msg)
  }
}

module.exports = buildRtsp
