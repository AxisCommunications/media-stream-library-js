const {Transform} = require('stream')
const {RTSP} = require('../messageTypes')
const {Rtsp} = require('../../utils/protocols')
const Component = require('../component')
const Config = require('../../utils/config')
const wwwAuthenticate = require('www-authenticate')

const UNAUTHORIZED = 401

const DEFAULT_CONFIG = {
  username: 'root',
  password: 'pass'
}

/*
 * This component currently only supports Basic authentication
 * It should be placed between the RTSP parser and the RTSP Session.
 */

class AuthComponent extends Component {
  constructor (config = {}) {
    const {username, password} = Config.merge(DEFAULT_CONFIG, config)

    let lastSentMessage, authHeader
    const outgoing = new Transform({
      objectMode: true,
      transform (msg, encoding, callback) {
        if (msg.type === RTSP) {
          lastSentMessage = msg
          if (authHeader) {
            msg.headers.Authorization = authHeader
          }
        }

        callback(null, msg)
      }
    })

    const incoming = new Transform({
      objectMode: true,
      transform (msg, encoding, callback) {
        if (msg.type === RTSP && Rtsp.statusCode(msg.data) === UNAUTHORIZED) {
          authHeader = 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
          const headers = msg.data.toString().split('\n')
          const wwwAuth = headers.find((header) => header.match('WWW-Auth'))
          const authenticator = wwwAuthenticate(username, password)(wwwAuth)
          authHeader = authenticator.authorize(lastSentMessage.method, '/axis-media/media.amp')

          // Retry last RTSP message
          // Write will fire our outgoing transform function.
          outgoing.write(lastSentMessage, callback)
        } else {
          // Not a message we should handle
          callback(null, msg)
        }
      }
    })

    super(incoming, outgoing)
  }
}

module.exports = AuthComponent
