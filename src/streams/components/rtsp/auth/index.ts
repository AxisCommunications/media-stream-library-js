import { fromByteArray } from 'base64-js'

import type { RtspRequestMessage, RtspResponseMessage } from '../../types/rtsp'
import { encode } from '../../utils/bytes'

import { DigestAuth } from './digest'
import { parseWWWAuthenticate } from './www-authenticate'

const UNAUTHORIZED = 401

export interface AuthConfig {
  username: string
  password: string
}

/**
 * Handles authentication on an RTSP session.
 * Note: this is a mostly untested experimental implementation
 * intended mainly for use in development and debugging.
 */
export class Auth {
  constructor(
    private readonly username: string,
    private readonly password: string
  ) {}

  /** Checks for WWW-Authenticate header and writes an Authentication header to the request.
   * Returns true if the request should be retried, false otherwise. */
  public authHeader(
    req: RtspRequestMessage,
    rsp: RtspResponseMessage
  ): boolean {
    if (rsp.statusCode !== UNAUTHORIZED) {
      return false
    }

    const wwwAuth = rsp.headers.get('WWW-Authenticate')
    if (!wwwAuth) {
      throw new Error('cannot find WWW-Authenticate header')
    }

    let authHeader: string | undefined = undefined
    const challenge = parseWWWAuthenticate(wwwAuth)
    if (challenge.type === 'basic') {
      authHeader = `Basic ${fromByteArray(encode(`${this.username}:${this.password}`))}`
    } else if (challenge.type === 'digest') {
      const digest = new DigestAuth(
        challenge.params,
        this.username,
        this.password
      )
      authHeader = digest.authorization(req.method, req.uri)
    }

    if (authHeader) {
      req.headers.Authorization = authHeader
      return true
    }

    return false
  }
}
