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
export const extractHeaderValue = (buffer: Buffer, header: string) => {
  const anchor = `\n${header}: `
  const start = buffer.indexOf(anchor)
  if (start >= 0) {
    const end = buffer.indexOf('\n', start + anchor.length)
    const headerValue = buffer
      .toString('ascii', start + anchor.length, end)
      .trim()
    return headerValue
  }
  return null
}

export const sequence = (buffer: Buffer) => {
  const val = extractHeaderValue(buffer, 'CSeq')
  if (val !== null) {
    return Number(val)
  }
  return null
}

export const sessionId = (buffer: Buffer) => {
  const val = extractHeaderValue(buffer, 'Session')
  return val ? val.split(';')[0] : null
}

export const sessionTimeout = (buffer: Buffer) => {
  const val = extractHeaderValue(buffer, 'Session')
  if (val === null) {
    return null
  }
  const timeoutToken = 'timeout='
  const timeoutPosition = val.indexOf(timeoutToken)
  if (timeoutPosition !== -1) {
    let timeoutVal = val.substring(timeoutPosition + timeoutToken.length)
    timeoutVal = timeoutVal.split(';')[0]
    const parsedTimeout = parseInt(timeoutVal)
    return isNaN(parsedTimeout) ? null : parsedTimeout
  }
  return null
}

export const statusCode = (buffer: Buffer) => {
  return Number(buffer.toString('ascii', 9, 12))
}

export const contentBase = (buffer: Buffer) => {
  return extractHeaderValue(buffer, 'Content-Base')
}

export const connectionEnded = (buffer: Buffer) => {
  return extractHeaderValue(buffer, 'Connection') === 'close'
}

export const range = (buffer: Buffer) => {
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
export const bodyOffset = (chunk: Buffer) => {
  const bodyOffsets = ['\n\n', '\r\r', '\r\n\r\n']
    .map(s => {
      const offset = chunk.indexOf(s)
      if (offset !== -1) {
        return offset + s.length
      }
      return offset
    })
    .filter(offset => offset !== -1)
  if (bodyOffsets.length > 0) {
    return bodyOffsets.reduce((acc, offset) => {
      return Math.min(acc, offset)
    })
  } else {
    return -1
  }
}
