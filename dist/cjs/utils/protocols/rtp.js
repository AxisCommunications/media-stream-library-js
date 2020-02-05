"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bits_1 = require("../bits");
// Real Time Protocol (RTP)
// https://tools.ietf.org/html/rfc3550#section-5.1
/*
RTP Fixed Header Fields

  0               1               2               3
  0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |V=2|P|X|  CC   |M|     PT      |       sequence number         |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                           timestamp                           |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |           synchronization source (SSRC) identifier            |
  +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
  |            contributing source (CSRC) identifiers             |
  |                             ....                              |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |   profile-specific ext. id    | profile-specific ext. length  |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                 profile-specific extension                    |
  |                             ....                              |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
*/
exports.version = (buffer) => {
    return buffer[0] >>> 6;
};
exports.padding = (buffer) => {
    return !!(buffer[0] & bits_1.POS[2]);
};
exports.extension = (buffer) => {
    return !!(buffer[0] & bits_1.POS[3]);
};
exports.cSrcCount = (buffer) => {
    return buffer[0] & 0x0f;
};
exports.marker = (buffer) => {
    return !!(buffer[1] & bits_1.POS[0]);
};
exports.payloadType = (buffer) => {
    return buffer[1] & 0x7f;
};
exports.sequenceNumber = (buffer) => {
    return buffer.readUInt16BE(2);
};
exports.timestamp = (buffer) => {
    return buffer.readUInt32BE(4);
};
exports.sSrc = (buffer) => {
    return buffer.readUInt32BE(8);
};
exports.cSrc = (buffer, rank = 0) => {
    return exports.cSrcCount(buffer) > rank ? buffer.readUInt32BE(12 + rank * 4) : 0;
};
exports.extHeaderLength = (buffer) => {
    return exports.extension(buffer) === false
        ? 0
        : buffer.readUInt16BE(12 + exports.cSrcCount(buffer) * 4 + 2);
};
exports.extHeader = (buffer) => {
    return exports.extHeaderLength(buffer) === 0
        ? Buffer.from([])
        : buffer.slice(12 + exports.cSrcCount(buffer) * 4, 12 + exports.cSrcCount(buffer) * 4 + 4 + exports.extHeaderLength(buffer) * 4);
};
exports.payload = (buffer) => {
    return exports.extension(buffer) === false
        ? buffer.slice(12 + exports.cSrcCount(buffer) * 4)
        : buffer.slice(12 + exports.cSrcCount(buffer) * 4 + 4 + exports.extHeaderLength(buffer) * 4);
};
//# sourceMappingURL=rtp.js.map