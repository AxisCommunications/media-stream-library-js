// A map of message types to use.
// Note that the message type 0 is not use so that one could use
// e.g.
//   if (!msg.type)
// without getting surprises.
module.exports = {
  RAW: 1,
  RTP: 2,
  RTCP: 3,
  RTSP: 4,
  SDP: 5,
  ELEMENTARY: 6,
  ISOM: 7,
  XML: 8
}
