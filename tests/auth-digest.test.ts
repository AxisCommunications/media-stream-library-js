import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import { authHeaders, cnonce, credentials, request } from './auth.fixtures'

import { DigestAuth } from '../src/streams/components/rtsp/auth/digest'
import { parseWWWAuthenticate } from '../src/streams/components/rtsp/auth/www-authenticate'

const header = authHeaders['WWW-Authenticate']

describe('RTSP: auth digest challenge', (test) => {
  test('generates the correct authentication header', () => {
    const challenge = parseWWWAuthenticate(header)
    const digest = new DigestAuth(
      challenge.params,
      credentials.username,
      credentials.password
    )
    // overwrite the cnonce function
    digest.cnonce = () => cnonce
    const authHeader = digest.authorization(request.method, request.uri)
    assert.is(authHeader, authHeaders.Authorization)
  })
})
