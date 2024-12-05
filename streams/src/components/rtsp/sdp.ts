import { Sdp } from '../types/sdp'

const extractLineVals = (body: string, lineStart: string, start = 0) => {
  const anchor = `\n${lineStart}`
  start = body.indexOf(anchor, start)
  let end = 0
  const ret: string[] = []
  while (start >= 0) {
    end = body.indexOf('\n', start + anchor.length)
    ret.push(body.substring(start + anchor.length, end).trim())
    start = body.indexOf(anchor, end)
  }
  return ret
}

/** Identify the start of a session-level or media-level section. */
const newMediaLevel = (line: string) => {
  return line.match(/^m=/)
}

const splitOnFirst = (c: string, text: string) => {
  const p = text.indexOf(c)
  if (p < 0) {
    return [text.slice(0)]
  }
  return [text.slice(0, p), text.slice(p + 1)]
}

const attributeParsers: any = {
  fmtp: (value: string) => {
    const [format, stringParameters] = splitOnFirst(' ', value)
    switch (format) {
      default: {
        const pairs = stringParameters.trim().split(';')
        const parameters: { [key: string]: any } = {}
        pairs.forEach((pair) => {
          const [key, val] = splitOnFirst('=', pair)
          const normalizedKey = key.trim().toLowerCase()
          if (normalizedKey !== '') {
            parameters[normalizedKey] = val.trim()
          }
        })
        return { format, parameters }
      }
    }
  },
  framerate: Number,
  rtpmap: (value: string) => {
    const [payloadType, encoding] = splitOnFirst(' ', value)
    const [encodingName, clockrate, encodingParameters] = encoding
      .toUpperCase()
      .split('/')
    if (encodingParameters === undefined) {
      return {
        payloadType: Number(payloadType),
        encodingName,
        clockrate: Number(clockrate),
      }
    }
    return {
      payloadType: Number(payloadType),
      encodingName,
      clockrate: Number(clockrate),
      encodingParameters,
    }
  },
  transform: (value: string) => {
    return value.split(';').map((row) => row.split(',').map(Number))
  },
  'x-sensor-transform': (value: string) => {
    return value.split(';').map((row) => row.split(',').map(Number))
  },
  framesize: (value: string) => {
    return value.split(' ')[1].split('-').map(Number)
  },
}

const parseAttribute = (body: string) => {
  const [attribute, value] = splitOnFirst(':', body)
  if (value === undefined) {
    return { [attribute]: true }
  }
  if (attributeParsers[attribute] !== undefined) {
    return { [attribute]: attributeParsers[attribute](value) }
  }
  return { [attribute]: value }
}

const extractField = (line: string) => {
  const prefix = line.slice(0, 1)
  const body = line.slice(2)
  switch (prefix) {
    case 'v':
      return { version: body }
    case 'o': {
      const [
        username,
        sessionId,
        sessionVersion,
        netType,
        addrType,
        unicastAddress,
      ] = body.split(' ')
      return {
        origin: {
          addrType,
          netType,
          sessionId,
          sessionVersion,
          unicastAddress,
          username,
        },
      }
    }
    case 's':
      return { sessionName: body }
    case 'i':
      return { sessionInformation: body }
    case 'u':
      return { uri: body }
    case 'e':
      return { email: body }
    case 'p':
      return { phone: body }
    // c=<nettype> <addrtype> <connection-address>
    case 'c': {
      const [connectionNetType, connectionAddrType, connectionAddress] =
        body.split(' ')
      return {
        connectionData: {
          addrType: connectionAddrType,
          connectionAddress,
          netType: connectionNetType,
        },
      }
    }
    // b=<bwtype>:<bandwidth>
    case 'b': {
      const [bwtype, bandwidth] = body.split(':')
      return { bwtype, bandwidth }
    }
    // t=<start-time> <stop-time>
    case 't': {
      const [startTime, stopTime] = body.split(' ').map(Number)
      return { time: { startTime, stopTime } }
    }
    // r=<repeat interval> <active duration> <offsets from start-time>
    case 'r': {
      const [repeatInterval, activeDuration, ...offsets] = body
        .split(' ')
        .map(Number)
      return {
        repeatTimes: { repeatInterval, activeDuration, offsets },
      }
    }
    // z=<adjustment time> <offset> <adjustment time> <offset> ....
    case 'z':
      return
    // k=<method>
    // k=<method>:<encryption key>
    case 'k':
      return
    // a=<attribute>
    // a=<attribute>:<value>
    case 'a':
      return parseAttribute(body)
    case 'm': {
      // Only the first fmt field is parsed!
      const [type, port, protocol, fmt] = body.split(' ')
      return { type, port: Number(port), protocol, fmt: Number(fmt) }
    }
    default:
  }
}

export const extractURIs = (body: string) => {
  // There is a control URI above the m= line, which should not be used
  const seekFrom = body.indexOf('\nm=')
  return extractLineVals(body, 'a=control:', seekFrom)
}

/** Parse an SDP text into a data structure with session and media objects. */
export const parseSdp = (body: string): Sdp => {
  const sdp = body.split('\n').map((s) => s.trim())
  const struct: { [key: string]: any } = { session: {}, media: [] }
  let current = struct.session
  for (const line of sdp) {
    if (newMediaLevel(line)) {
      current = {}
      struct.media.push(current)
    }
    current = Object.assign(current, extractField(line))
  }
  return struct as Sdp
}
