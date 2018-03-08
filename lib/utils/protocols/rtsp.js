/*
Example data:
RTSP/1.0 200 OK
CSeq: 3
Content-Type: application/sdp
Content-Base: rtsp://192.168.0.3/axis-media/media.amp/
Server: GStreamer RTSP server
Date: Wed, 03 Jun 2015 14:23:42 GMT
Content-Length: 623

v=0
....
*/
const extractHeaderValue = (buffer, header) => {
  const anchor = `\n${header}: `
  const start = buffer.indexOf(anchor)
  if (start >= 0) {
    const end = buffer.indexOf('\n', start + anchor.length)
    const headerValue = buffer.toString('ascii', start + anchor.length, end).trim()
    return headerValue
  }
  return null
}

const sequence = (buffer) => {
  const val = extractHeaderValue(buffer, 'CSeq')
  if (val !== null) {
    return Number(val)
  }
  return null
}

const sessionId = (buffer) => {
  const val = extractHeaderValue(buffer, 'Session')
  return val ? val.split(';')[0] : null
}

const statusCode = (buffer) => {
  return Number(buffer.toString('ascii', 9, 12))
}

const contentBase = (buffer) => {
  return extractHeaderValue(buffer, 'Content-Base')
}

const connectionEnded = (buffer) => {
  return extractHeaderValue(buffer, 'Connection') === 'close'
}

const range = (buffer) => {
  // Possible range headers:
  // Range: npt=now-
  // Range: npt=1154.598701-3610.259146
  const npt = extractHeaderValue(buffer, 'Range')
  if (npt !== null) {
    return npt.split('=')[1].split('-')
  }
  return undefined
}

/**
 * Determine the offset of the RTSP body, where the header ends.
 * If there is no header ending, -1 is returned
 * @param {Buffer} chunk A piece of data
 * @return {Number}      The body offset, or -1 if no header end found
 */
const bodyOffset = (chunk) => {
  const bodyOffsets = ['\n\n', '\r\r', '\r\n\r\n']
    .map((s) => {
      const offset = chunk.indexOf(s)
      if (offset !== -1) {
        return offset + s.length
      }
      return offset
    })
    .filter((offset) => offset !== -1)
  if (bodyOffsets.length > 0) {
    return bodyOffsets.reduce((offset, bodyOffset) => {
      return Math.min(offset, bodyOffset)
    })
  } else {
    return -1
  }
}

module.exports = {
  sequence,
  sessionId,
  statusCode,
  contentBase,
  connectionEnded,
  range,
  bodyOffset
}
