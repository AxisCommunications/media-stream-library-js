import { authHeaders, credentials, request, cnonce } from './fixtures'
import { DigestAuth } from './digest'
import { parseWWWAuthenticate } from './www-authenticate'
const header = authHeaders['WWW-Authenticate']

describe('digest challenge', () => {
  it('generates the correct authentication header', () => {
    const challenge = parseWWWAuthenticate(header)
    const digest = new DigestAuth(
      challenge.params,
      credentials.username,
      credentials.password,
    )
    // overwrite the cnonce function
    digest.cnonce = () => cnonce
    const authHeader = digest.authorization(request.method, request.uri)
    expect(authHeader).toEqual(authHeaders.Authorization)
  })
})
