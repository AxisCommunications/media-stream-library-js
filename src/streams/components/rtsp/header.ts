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
 * header specifications:
 *
 * Content-Base       =  "Content-Base" HCOLON RTSP-URI
 * Content-Length     =  "Content-Length" HCOLON 1*19DIGIT
 * Content-Location   =  "Content-Location" HCOLON RTSP-REQ-Ref
 * Session            =  "Session" HCOLON session-id
 *                       [ SEMI "timeout" EQUAL delta-seconds ]
 * session-id         =  1*256( ALPHA / DIGIT / safe )
 * delta-seconds      =  1*19DIGIT
 * Connection         =  "Connection" HCOLON connection-token
 *                       *(COMMA connection-token)
 * connection-token   =  "close" / token
 * CSeq               =  "CSeq" HCOLON cseq-nr
 * cseq-nr            =  1*9DIGIT
 * Range              =  "Range" HCOLON ranges-spec
 * ranges-spec        =  npt-range / utc-range / smpte-range
 *                       /  range-ext
 * npt-range          =  "npt" [EQUAL npt-range-spec]
 * npt-range-spec     =  ( npt-time "-" [ npt-time ] ) / ( "-" npt-time )
 * npt-time           =  "now" / npt-sec / npt-hhmmss / npt-hhmmss-comp
 * npt-sec            =  1*19DIGIT [ "." 1*9DIGIT ]
 * npt-hhmmss         =  npt-hh ":" npt-mm ":" npt-ss [ "." 1*9DIGIT ]
 * npt-hh             =  2*19DIGIT   ; any positive number
 * npt-mm             =  2*2DIGIT  ; 0-59
 * npt-ss             =  2*2DIGIT  ; 0-59
 * npt-hhmmss-comp    =  npt-hh-comp ":" npt-mm-comp ":" npt-ss-comp
 *                       [ "." 1*9DIGIT ] ; Compatibility format
 * npt-hh-comp        =  1*19DIGIT   ; any positive number
 * npt-mm-comp        =  1*2DIGIT  ; 0-59
 * npt-ss-comp        =  1*2DIGIT  ; 0-59
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

/**
 * Parse headers from an RTSP response. The body can be included as the
 * parser will stop at the first empty line.
 *
 * First line is "start-line":
 * <RTSP-Version> SP <Status-Code> SP <Reason Phrase> CRLF
 *
 * Rest is actual headers:
 * Content-Base       =  "Content-Base" HCOLON RTSP-URI
 */
export function parseResponse(response: string): {
  statusCode: number
  headers: Headers
} {
  const messageLines = response
    .trimStart()
    .split('\n')
    .map((line) => line.trim())
  const [startline, ...headerlines] = messageLines

  const [_rtspVersion, statusCode, _reasonPhrase] = startline.split(' ')

  const headers = new Headers()
  for (const line of headerlines) {
    if (line === '') break
    const separator = line.indexOf(':')
    const key = line.substring(0, separator).trim().toLowerCase()
    const value = line.substring(separator + 1).trim()
    headers.set(key.trim(), value.trim())
  }

  return {
    statusCode: Number.parseInt(statusCode),
    headers,
  }
}

const ASCII = { LF: 10, CR: 13 } as const
interface HeaderTerminator {
  byteLength: number
  sequence: string
  startByte: (typeof ASCII)[keyof typeof ASCII]
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

// Parse value from a session header "Session: <session-id>[;timeout=<delta-seconds>]"
// Examples:
//   1234567890;timeout=600
//   60D9C7BC;timeout=3
export const parseSession = (
  session: string
): { id: string; timeout?: number } => {
  let sep = session.indexOf(';')
  if (sep === -1) {
    return { id: session }
  }
  const id = session.slice(0, sep)
  const timeoutKeyValue = session.slice(sep + 1).trim()
  sep = timeoutKeyValue.indexOf('=')
  const timeout = Number.parseInt(timeoutKeyValue.slice(sep + 1).trim())
  return { id, timeout }
}

// Parse value from a Range header "Range: npt=<start>-<end>"
// Examples:
//   npt=now-
//   npt=1154.598701-3610.259146
export const parseRange = (range: string): [string, string] => {
  let sep = range.indexOf('=')
  const npt = range.slice(sep + 1)
  const [start, end] = npt.split('-')
  return [start, end]
}
