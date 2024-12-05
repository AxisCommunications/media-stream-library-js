/*
 * The RTSP response format is defined in RFC 7826,
 * using ABNF notation specified in RFC 5234.
 * Strings in ABNF rules ("...") are always case insensitive!
 *
 * Basic rules to help with the headers below:
 * ====
 * CR              =  %x0D ; US-ASCII CR, carriage return (13)
 * LF              =  %x0A  ; US-ASCII LF, linefeed (10)
 * SP              =  %x20  ; US-ASCII SP, space (32)
 * HT              =  %x09  ; US-ASCII HT, horizontal-tab (9)
 * CRLF            =  CR LF
 * LWS             =  [CRLF] 1*( SP / HT ) ; Line-breaking whitespace
 * SWS             =  [LWS] ; Separating whitespace
 * HCOLON          =  *( SP / HT ) ":" SWS
 *
 * RTSP response rules (a `*` means zero or more):
 * ====
 * Status-Line  = RTSP-Version SP Status-Code SP Reason-Phrase CRLF
 * Response     = Status-Line
 *                *((general-header
 *                /  response-header
 *                /  message-body-header) CRLF)
 *                CRLF
 *                [ message-body-data ]
 *
 * Example response:
 * ====
 * RTSP/1.0 200 OK
 * CSeq: 3
 * Content-Type: application/sdp
 * Content-Base: rtsp://192.168.0.3/axis-media/media.amp/
 * Server: GStreamer RTSP server
 * Date: Wed, 03 Jun 2015 14:23:42 GMT
 * Content-Length: 623
 *
 * v=0
 * ....
 */

export const ASCII = {
  LF: 10,
  CR: 13,
} as const

/**
 * Extract the value of a header.
 *
 * @param buffer The response bytes
 * @param key The header to search for
 */
export const extractHeaderValue = (header: string, key: string) => {
  const anchor = `\n${key.toLowerCase()}: `
  const start = header.toLowerCase().indexOf(anchor)
  if (start >= 0) {
    const end = header.indexOf('\n', start + anchor.length)
    const headerValue = header.substring(start + anchor.length, end).trim()
    return headerValue
  }
  return null
}

export const sequence = (header: string) => {
  /**
   * CSeq           =  "CSeq" HCOLON cseq-nr
   * cseq-nr        =  1*9DIGIT
   */
  const val = extractHeaderValue(header, 'CSeq')
  if (val !== null) {
    return Number(val)
  }
  return null
}

export const sessionId = (header: string) => {
  /**
   * Session          =  "Session" HCOLON session-id
   *                     [ SEMI "timeout" EQUAL delta-seconds ]
   * session-id        =  1*256( ALPHA / DIGIT / safe )
   * delta-seconds     =  1*19DIGIT
   */
  const val = extractHeaderValue(header, 'Session')
  return val ? val.split(';')[0] : null
}

export const sessionTimeout = (header: string) => {
  /**
   * Session          =  "Session" HCOLON session-id
   *                     [ SEMI "timeout" EQUAL delta-seconds ]
   * session-id        =  1*256( ALPHA / DIGIT / safe )
   * delta-seconds     =  1*19DIGIT
   */
  const val = extractHeaderValue(header, 'Session')
  if (val === null) {
    return null
  }
  const defaultTimeout = 60
  const timeoutToken = 'timeout='
  const timeoutPosition = val.toLowerCase().indexOf(timeoutToken)
  if (timeoutPosition !== -1) {
    let timeoutVal = val.substring(timeoutPosition + timeoutToken.length)
    timeoutVal = timeoutVal.split(';')[0]
    const parsedTimeout = parseInt(timeoutVal)
    return Number.isNaN(parsedTimeout) ? defaultTimeout : parsedTimeout
  }
  return defaultTimeout
}

export const statusCode = (header: string) => {
  return Number(header.substring(9, 12))
}

export const contentBase = (header: string) => {
  /**
   * Content-Base       =  "Content-Base" HCOLON RTSP-URI
   */
  return extractHeaderValue(header, 'Content-Base')
}

export const contentLocation = (header: string) => {
  /**
   * Content-Location   =  "Content-Location" HCOLON RTSP-REQ-Ref
   */
  return extractHeaderValue(header, 'Content-Location')
}

export const connectionEnded = (header: string) => {
  /**
   * Connection         =  "Connection" HCOLON connection-token
   *                       *(COMMA connection-token)
   * connection-token   =  "close" / token
   */
  const connectionToken = extractHeaderValue(header, 'Connection')
  return connectionToken !== null && connectionToken.toLowerCase() === 'close'
}

export const range = (header: string) => {
  /**
   * Range              =  "Range" HCOLON ranges-spec
   * ranges-spec        =  npt-range / utc-range / smpte-range
   *                       /  range-ext
   * npt-range        =  "npt" [EQUAL npt-range-spec]
   * npt-range-spec   =  ( npt-time "-" [ npt-time ] ) / ( "-" npt-time )
   * npt-time         =  "now" / npt-sec / npt-hhmmss / npt-hhmmss-comp
   * npt-sec          =  1*19DIGIT [ "." 1*9DIGIT ]
   * npt-hhmmss       =  npt-hh ":" npt-mm ":" npt-ss [ "." 1*9DIGIT ]
   * npt-hh           =  2*19DIGIT   ; any positive number
   * npt-mm           =  2*2DIGIT  ; 0-59
   * npt-ss           =  2*2DIGIT  ; 0-59
   * npt-hhmmss-comp  =  npt-hh-comp ":" npt-mm-comp ":" npt-ss-comp
   *                     [ "." 1*9DIGIT ] ; Compatibility format
   * npt-hh-comp      =  1*19DIGIT   ; any positive number
   * npt-mm-comp      =  1*2DIGIT  ; 0-59
   * npt-ss-comp      =  1*2DIGIT  ; 0-59
   */

  // Example range headers:
  // Range: npt=now-
  // Range: npt=1154.598701-3610.259146
  const npt = extractHeaderValue(header, 'Range')
  if (npt !== null) {
    return npt.split('=')[1].split('-')
  }
  return undefined
}

interface HeaderTerminator {
  byteLength: number
  sequence: string
  startByte: number
}
const headerTerminators: HeaderTerminator[] = [
  // expected
  { sequence: '\r\n\r\n', startByte: ASCII.CR, byteLength: 4 },
  // legacy compatibility
  { sequence: '\r\r', startByte: ASCII.CR, byteLength: 2 },
  { sequence: '\n\n', startByte: ASCII.LF, byteLength: 2 },
]

/**
 * Determine the offset of the RTSP body, where the header ends.
 * If there is no header ending, -1 is returned
 * @param  chunk - A piece of data
 * @return The body offset, or -1 if no header end found
 */
export const bodyOffset = (chunk: Uint8Array) => {
  // Strictly speaking, it seems RTSP MUST have CRLF and doesn't allow CR or LF on its own.
  // That means that the end of the header part should be a pair of CRLF, but we're being
  // flexible here and also allow LF LF or CR CR instead of CRLF CRLF (should be handled
  // according to version 1.0)
  const dec = new TextDecoder()

  for (const terminator of headerTerminators) {
    const terminatorOffset = chunk.findIndex((value, index, array) => {
      if (value === terminator.startByte) {
        const candidate = dec.decode(
          array.slice(index, index + terminator.byteLength)
        )

        if (candidate === terminator.sequence) {
          return true
        }
      }
      return false
    })
    if (terminatorOffset !== -1) {
      return terminatorOffset + terminator.byteLength
    }
  }

  return -1
}
