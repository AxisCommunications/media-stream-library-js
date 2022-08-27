import * as assert from 'uvu/assert'

import { DigestAuth } from 'components/auth/digest'
import { parseWWWAuthenticate } from 'components/auth/www-authenticate'

import { authHeaders, cnonce, credentials, request } from './auth.fixtures'
import { describe } from './uvu-describe'

const header = authHeaders['WWW-Authenticate']

describe('digest challenge', (test) => {
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
