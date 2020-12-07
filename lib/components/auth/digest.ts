// https://tools.ietf.org/html/rfc2617#section-3.2.1
import { Md5 as MD5 } from 'ts-md5'
import { ChallengeParams } from './www-authenticate'

export class DigestAuth {
  private readonly realm: string
  private readonly nonce: string
  private readonly opaque?: string
  private readonly algorithm?: 'md5' | 'md5-sess'
  private readonly qop?: 'auth' | 'auth-int'
  private readonly username: string

  private readonly ha1Base: string
  private count: number

  constructor(params: ChallengeParams, username: string, password: string) {
    const realm = params.get('realm')
    if (realm === undefined) {
      throw new Error('no realm in digest challenge')
    }
    this.realm = realm
    this.ha1Base = new MD5()
      .appendStr(`${username}:${realm}:${password}`)
      .end()
      .toString()

    const nonce = params.get('nonce')
    if (nonce === undefined) {
      throw new Error('no nonce in digest challenge')
    }
    this.nonce = nonce

    this.opaque = params.get('opaque')

    const algorithm = params.get('algorithm')
    if (algorithm !== undefined) {
      if (algorithm === 'md5') {
        this.algorithm = 'md5'
      } else if (algorithm === 'md5-sess') {
        this.algorithm = 'md5-sess'
      }
    } else {
      this.algorithm = 'md5'
    }

    const qop = params.get('qop')
    if (qop !== undefined) {
      const possibleQops = qop.split(',').map((qopType) => qopType.trim())
      if (possibleQops.some((qopValue) => qopValue === 'auth')) {
        this.qop = 'auth'
      } else if (possibleQops.some((qopValue) => qopValue === 'auth-int')) {
        this.qop = 'auth-int'
      }
    }

    this.count = 0
    this.username = username
  }

  nc = () => {
    ++this.count
    return this.count.toString(16).padStart(8, '0')
  }

  cnonce = () => {
    return new Array(4)
      .fill(0)
      .map(() => Math.floor(Math.random() * 256))
      .map((n) => n.toString(16))
      .join('')
  }

  ha1 = (cnonce: string): string => {
    let ha1 = this.ha1Base
    if (this.algorithm === 'md5-sess') {
      ha1 = new MD5()
        .appendStr(`${ha1}:${this.nonce}:${cnonce}`)
        .end()
        .toString()
    }
    return ha1
  }

  ha2 = (method: string, uri: string, body = ''): string => {
    let ha2 = new MD5().appendStr(`${method}:${uri}`).end().toString()
    if (this.algorithm === 'md5-sess') {
      const hbody = new MD5().appendStr(body).end().toString()
      ha2 = new MD5().appendStr(`${method}:${uri}:${hbody}`).end().toString()
    }
    return ha2
  }

  authorization = (method = 'GET', uri = '', body?: string): string => {
    // Increase count
    const nc = this.nc()
    const cnonce = this.cnonce()

    const ha1 = this.ha1(cnonce)
    const ha2 = this.ha2(method, uri, body)

    const response =
      this.qop === undefined
        ? new MD5().appendStr(`${ha1}:${this.nonce}:${ha2}`).end().toString()
        : new MD5()
            .appendStr(
              `${ha1}:${this.nonce}:${nc}:${cnonce}:${this.qop}:${ha2}`,
            )
            .end()
            .toString()

    const authorizationParams: string[] = []
    authorizationParams.push(`username="${this.username}"`)
    authorizationParams.push(`realm="${this.realm}"`)
    authorizationParams.push(`nonce="${this.nonce}"`)
    authorizationParams.push(`uri="${uri}"`)
    if (this.qop !== undefined) {
      authorizationParams.push(`qop=${this.qop}`)
      authorizationParams.push(`nc=${nc}`)
      authorizationParams.push(`cnonce="${cnonce}"`)
    }
    authorizationParams.push(`response="${response}"`)
    if (this.opaque !== undefined) {
      authorizationParams.push(`opaque="${this.opaque}"`)
    }
    return `Digest ${authorizationParams.join(', ')}`
  }
}
