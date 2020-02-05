import { POS } from '../bits';
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
export var version = function (buffer) {
    return buffer[0] >>> 6;
};
export var padding = function (buffer) {
    return !!(buffer[0] & POS[2]);
};
export var extension = function (buffer) {
    return !!(buffer[0] & POS[3]);
};
export var cSrcCount = function (buffer) {
    return buffer[0] & 0x0f;
};
export var marker = function (buffer) {
    return !!(buffer[1] & POS[0]);
};
export var payloadType = function (buffer) {
    return buffer[1] & 0x7f;
};
export var sequenceNumber = function (buffer) {
    return buffer.readUInt16BE(2);
};
export var timestamp = function (buffer) {
    return buffer.readUInt32BE(4);
};
export var sSrc = function (buffer) {
    return buffer.readUInt32BE(8);
};
export var cSrc = function (buffer, rank) {
    if (rank === void 0) { rank = 0; }
    return cSrcCount(buffer) > rank ? buffer.readUInt32BE(12 + rank * 4) : 0;
};
export var extHeaderLength = function (buffer) {
    return extension(buffer) === false
        ? 0
        : buffer.readUInt16BE(12 + cSrcCount(buffer) * 4 + 2);
};
export var extHeader = function (buffer) {
    return extHeaderLength(buffer) === 0
        ? Buffer.from([])
        : buffer.slice(12 + cSrcCount(buffer) * 4, 12 + cSrcCount(buffer) * 4 + 4 + extHeaderLength(buffer) * 4);
};
export var payload = function (buffer) {
    return extension(buffer) === false
        ? buffer.slice(12 + cSrcCount(buffer) * 4)
        : buffer.slice(12 + cSrcCount(buffer) * 4 + 4 + extHeaderLength(buffer) * 4);
};
//# sourceMappingURL=rtp.js.map