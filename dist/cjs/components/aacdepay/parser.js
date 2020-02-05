"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rtp_1 = require("../../utils/protocols/rtp");
const message_1 = require("../message");
/*
From RFC 3640 https://tools.ietf.org/html/rfc3640
  2.11.  Global Structure of Payload Format

     The RTP payload following the RTP header, contains three octet-
     aligned data sections, of which the first two MAY be empty, see
     Figure 1.

           +---------+-----------+-----------+---------------+
           | RTP     | AU Header | Auxiliary | Access Unit   |
           | Header  | Section   | Section   | Data Section  |
           +---------+-----------+-----------+---------------+

                     <----------RTP Packet Payload----------->

              Figure 1: Data sections within an RTP packet
Note that auxilary section is empty for AAC-hbr

  3.2.1.  The AU Header Section

   When present, the AU Header Section consists of the AU-headers-length
   field, followed by a number of AU-headers, see Figure 2.

      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- .. -+-+-+-+-+-+-+-+-+-+
      |AU-headers-length|AU-header|AU-header|      |AU-header|padding|
      |                 |   (1)   |   (2)   |      |   (n)   | bits  |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- .. -+-+-+-+-+-+-+-+-+-+

                   Figure 2: The AU Header Section
*/
function parse(rtp, hasHeader, callback) {
    const buffer = rtp_1.payload(rtp.data);
    let headerLength = 0;
    if (hasHeader) {
        const auHeaderLengthInBits = buffer.readUInt16BE(0);
        headerLength = 2 + (auHeaderLengthInBits + (auHeaderLengthInBits % 8)) / 8; // Add padding
    }
    const packet = {
        type: message_1.MessageType.ELEMENTARY,
        data: buffer.slice(headerLength),
        payloadType: rtp_1.payloadType(rtp.data),
        timestamp: rtp_1.timestamp(rtp.data),
        ntpTimestamp: rtp.ntpTimestamp,
    };
    callback(packet);
}
exports.parse = parse;
//# sourceMappingURL=parser.js.map