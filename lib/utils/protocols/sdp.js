/* eslint-disable */
/*
v=0
o=- 12566106766544666011 1 IN IP4 192.168.0.90
s=Session streamed with GStreamer
i=rtsp-server
t=0 0
a=tool:GStreamer
a=type:broadcast
a=range:npt=now-
a=control:rtsp://192.168.0.90/axis-media/media.amp?audio=1
m=video 0 RTP/AVP 96
c=IN IP4 0.0.0.0
b=AS:50000
a=rtpmap:96 H264/90000
a=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=blabla=,aO48gA==
a=control:rtsp://192.168.0.90/axis-media/media.amp/stream=0?audio=1
a=framerate:25.000000
a=transform:1.000000,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000
m=audio 0 RTP/AVP 0
c=IN IP4 0.0.0.0
b=AS:64
a=rtpmap:0 PCMU/8000
a=control:rtsp://192.168.0.90/axis-media/media.amp/stream=1?audio=1


v=0
o=- 1492696695742866 1492696695742866 IN IP4 172.25.100.128
s=Media Presentation
e=NONE
b=AS:50032
t=0 0
a=control:rtsp://172.25.100.128:554/axis-media/media.amp?audio=1
a=range:npt=0.000000-
m=video 0 RTP/AVP 96
c=IN IP4 0.0.0.0
b=AS:50000
a=framerate:30.0
a=transform:1.000000,0.000000,0.000000;0.000000,0.900000,0.000000;0.000000,0.000000,1.000000
a=control:rtsp://172.25.100.128:554/axis-media/media.amp/trackID=1?audio=1
a=rtpmap:96 H264/90000
a=fmtp:96 packetization-mode=1; profile-level-id=420029; sprop-parameter-sets=Z0IAKeKQCgC3YC3AQEBpB4kRUA==,aM48gA==
m=audio 0 RTP/AVP 97
c=IN IP4 0.0.0.0
b=AS:32
a=control:rtsp://172.25.100.128:554/axis-media/media.amp/trackID=2?audio=1
a=rtpmap:97 mpeg4-generic/16000/1
a=fmtp:97 streamtype=5; profile-level-id=15; mode=AAC-hbr; config=1408; sizeLength=13; indexLength=3; indexDeltaLength=3; profile=1; bitrate=32000;
*/
/* eslint-enable */
const extractLineVals = (buffer, lineStart, start = 0) => {
  const anchor = `\n${lineStart}`
  start = buffer.indexOf(anchor, start)
  let end = 0
  const ret = []
  while (start >= 0) {
    end = buffer.indexOf('\n', start + anchor.length)
    ret.push(buffer.toString('ascii', start + anchor.length, end).trim())
    start = buffer.indexOf(anchor, end)
  }
  return ret
}

// SDP parsing

/**
 * Identify the start of a session-level or media-level section.
 * @param  {String} line The line to parse
 * @return {Object}      Object with a type + name
 */
const newMediaLevel = (line) => {
  return line.match(/^m=/)
}

const splitOnFirst = (c, text) => {
  const p = text.indexOf(c)
  if (p < 0) {
    return [text.slice(0)]
  } else {
    return [text.slice(0, p), text.slice(p + 1)]
  }
}

const attributeParsers = {
  fmtp: (value) => {
    let [format, parameters] = splitOnFirst(' ', value)
    switch (format) {
      default:
        const pairs = parameters.trim().split(';')
        parameters = {}
        pairs.forEach((pair) => {
          const [key, val] = splitOnFirst('=', pair)
          const normalizedKey = key.trim().toLowerCase()
          if (normalizedKey !== '') {
            parameters[normalizedKey] = val.trim()
          }
        })
        return {format, parameters}
    }
  },
  rtpmap: (value) => {
    let [payloadType, encoding] = splitOnFirst(' ', value)
    let [encodingName, clockrate, encodingParameters] = encoding.toUpperCase().split('/')
    if (encodingParameters === undefined) {
      return {payloadType, encodingName, clockrate}
    } else {
      return {payloadType, encodingName, clockrate, encodingParameters}
    }
  },
  transform: (value) => {
    return value.split(';').map((row) => row.split(',').map(Number))
  }
}

const parseAttribute = (body) => {
  const [attribute, value] = splitOnFirst(':', body)
  if (value === undefined) {
    return {[attribute]: true}
  } else {
    if (attributeParsers[attribute] !== undefined) {
      return {[attribute]: attributeParsers[attribute](value)}
    } else {
      return {[attribute]: (value)}
    }
  }
}

const extractField = (line) => {
  const prefix = line.slice(0, 1)
  const body = line.slice(2)
  switch (prefix) {
    case 'v':
      return {version: body}
    case 'o':
      const [
        username,
        sessionId,
        sessionVersion,
        netType,
        addrType,
        unicastAddress
      ] = body.split(' ')
      return {origin: {
        username,
        sessionId,
        sessionVersion,
        netType,
        addrType,
        unicastAddress
      }}
    case 's':
      return {sessionName: body}
    case 'i':
      return {sessionInformation: body}
    case 'u':
      return {uri: body}
    case 'e':
      return {email: body}
    case 'p':
      return {phone: body}
    // c=<nettype> <addrtype> <connection-address>
    case 'c':
      const [
        connectionNetType,
        connectionAddrType,
        connectionAddress
      ] = body.split(' ')
      return {connectionData: {
        netType: connectionNetType,
        addrType: connectionAddrType,
        connectionAddress}
      }
    // b=<bwtype>:<bandwidth>
    case 'b':
      const [bwtype, bandwidth] = body.split(':')
      return {bwtype, bandwidth}
    // t=<start-time> <stop-time>
    case 't':
      const [startTime, stopTime] = body.split(' ')
      return {timing: {startTime, stopTime}}
    // r=<repeat interval> <active duration> <offsets from start-time>
    case 'r':
      const [repeatInterval, activeDuration, ...offsetsFromStart] = body.split(' ')
      return {repeatTimes: {repeatInterval, activeDuration, offsetsFromStart}}
    // z=<adjustment time> <offset> <adjustment time> <offset> ....
    case 'z':
      const adjustmentTimes = body.split(' ')
      return {adjustmentTimes}
    // k=<method>
    // k=<method>:<encryption key>
    case 'k':
      const [encryptionMethod, encryptionKey] = splitOnFirst(':', body)
      if (encryptionKey === undefined) {
        return {encryptionMethod}
      } else {
        return {encryptionMethod, encryptionKey}
      }
    // a=<attribute>
    // a=<attribute>:<value>
    case 'a':
      return parseAttribute(body)
    case 'm':
      const [type, port, proto, fmt] = body.split(' ')
      return {type, port, proto, fmt}
    default:
      // console.log('unknown SDP prefix ', prefix);
  }
}

// const extractMediaField = (line) => {
//   const prefix = line.slice(0, 1);
//   const body = line.slice(2);
//   switch (prefix) {
//     case 'm':
//       const [type, port, proto, fmt] = body.split(' ');
//       return {type, port, proto, fmt};
//     case 'a':
//       return parseAttribute(body);
//     default:
//       console.log('unknown SDP media prefix ', prefix);
//   }
// };

const extractURIs = (buffer) => {
  // There is a control URI above the m= line, which should not be used
  const seekFrom = buffer.indexOf('\nm=')
  return extractLineVals(buffer, 'a=control:', seekFrom)
}

/**
 * Create an array of sprop-parameter-sets elements
 * @param  {Buffer} buffer The buffer containing the sdp data
 * @return {Array}         The differen parameter strings
 */
const parse = (buffer) => {
  const sdp = buffer.toString('ascii').split('\n').map((s) => s.trim())
  const struct = {}
  struct.session = {}
  struct.media = []
  let mediaCounter = 0
  let current = struct.session
  for (const line of sdp) {
    if (newMediaLevel(line)) {
      struct.media[mediaCounter] = {}
      current = struct.media[mediaCounter]
      ++mediaCounter
    }
    current = Object.assign(current, extractField(line))
  }
  return struct
}

const {SDP} = require('../../components/messageTypes')

const messageFromBuffer = (buffer) => {
  return {
    type: SDP,
    data: buffer,
    sdp: parse(buffer)
  }
}

module.exports = {
  extractURIs,
  parse,
  messageFromBuffer
}
