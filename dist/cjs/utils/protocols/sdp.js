"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("../../components/message");
const extractLineVals = (buffer, lineStart, start = 0) => {
    const anchor = `\n${lineStart}`;
    start = buffer.indexOf(anchor, start);
    let end = 0;
    const ret = [];
    while (start >= 0) {
        end = buffer.indexOf('\n', start + anchor.length);
        ret.push(buffer.toString('ascii', start + anchor.length, end).trim());
        start = buffer.indexOf(anchor, end);
    }
    return ret;
};
// SDP parsing
/**
 * Identify the start of a session-level or media-level section.
 * @param  {String} line The line to parse
 * @return {Object}      Object with a type + name
 */
const newMediaLevel = (line) => {
    return line.match(/^m=/);
};
const splitOnFirst = (c, text) => {
    const p = text.indexOf(c);
    if (p < 0) {
        return [text.slice(0)];
    }
    else {
        return [text.slice(0, p), text.slice(p + 1)];
    }
};
const attributeParsers = {
    fmtp: (value) => {
        const [format, stringParameters] = splitOnFirst(' ', value);
        switch (format) {
            default:
                const pairs = stringParameters.trim().split(';');
                const parameters = {};
                pairs.forEach(pair => {
                    const [key, val] = splitOnFirst('=', pair);
                    const normalizedKey = key.trim().toLowerCase();
                    if (normalizedKey !== '') {
                        parameters[normalizedKey] = val.trim();
                    }
                });
                return { format, parameters };
        }
    },
    framerate: Number,
    rtpmap: (value) => {
        const [payloadType, encoding] = splitOnFirst(' ', value);
        const [encodingName, clockrate, encodingParameters,] = encoding.toUpperCase().split('/');
        if (encodingParameters === undefined) {
            return {
                payloadType: Number(payloadType),
                encodingName,
                clockrate: Number(clockrate),
            };
        }
        else {
            return {
                payloadType: Number(payloadType),
                encodingName,
                clockrate: Number(clockrate),
                encodingParameters,
            };
        }
    },
    transform: (value) => {
        return value.split(';').map(row => row.split(',').map(Number));
    },
    framesize: (value) => {
        return value
            .split(' ')[1]
            .split('-')
            .map(Number);
    },
};
const parseAttribute = (body) => {
    const [attribute, value] = splitOnFirst(':', body);
    if (value === undefined) {
        return { [attribute]: true };
    }
    else {
        if (attributeParsers[attribute] !== undefined) {
            return { [attribute]: attributeParsers[attribute](value) };
        }
        else {
            return { [attribute]: value };
        }
    }
};
const extractField = (line) => {
    const prefix = line.slice(0, 1);
    const body = line.slice(2);
    switch (prefix) {
        case 'v':
            return { version: body };
        case 'o':
            const [username, sessionId, sessionVersion, netType, addrType, unicastAddress,] = body.split(' ');
            return {
                origin: {
                    addrType,
                    netType,
                    sessionId,
                    sessionVersion,
                    unicastAddress,
                    username,
                },
            };
        case 's':
            return { sessionName: body };
        case 'i':
            return { sessionInformation: body };
        case 'u':
            return { uri: body };
        case 'e':
            return { email: body };
        case 'p':
            return { phone: body };
        // c=<nettype> <addrtype> <connection-address>
        case 'c':
            const [connectionNetType, connectionAddrType, connectionAddress,] = body.split(' ');
            return {
                connectionData: {
                    addrType: connectionAddrType,
                    connectionAddress,
                    netType: connectionNetType,
                },
            };
        // b=<bwtype>:<bandwidth>
        case 'b':
            const [bwtype, bandwidth] = body.split(':');
            return { bwtype, bandwidth };
        // t=<start-time> <stop-time>
        case 't':
            const [startTime, stopTime] = body.split(' ').map(Number);
            return { time: { startTime, stopTime } };
        // r=<repeat interval> <active duration> <offsets from start-time>
        case 'r':
            const [repeatInterval, activeDuration, ...offsets] = body
                .split(' ')
                .map(Number);
            return {
                repeatTimes: { repeatInterval, activeDuration, offsets },
            };
        // z=<adjustment time> <offset> <adjustment time> <offset> ....
        case 'z':
            return;
        // k=<method>
        // k=<method>:<encryption key>
        case 'k':
            return;
        // a=<attribute>
        // a=<attribute>:<value>
        case 'a':
            return parseAttribute(body);
        case 'm':
            // Only the first fmt field is parsed!
            const [type, port, protocol, fmt] = body.split(' ');
            return { type, port: Number(port), protocol, fmt: Number(fmt) };
        default:
        // console.log('unknown SDP prefix ', prefix);
    }
};
exports.extractURIs = (buffer) => {
    // There is a control URI above the m= line, which should not be used
    const seekFrom = buffer.indexOf('\nm=');
    return extractLineVals(buffer, 'a=control:', seekFrom);
};
/**
 * Create an array of sprop-parameter-sets elements
 * @param  {Buffer} buffer The buffer containing the sdp data
 * @return {Array}         The differen parameter strings
 */
exports.parse = (buffer) => {
    const sdp = buffer
        .toString('ascii')
        .split('\n')
        .map(s => s.trim());
    const struct = { session: {}, media: [] };
    let mediaCounter = 0;
    let current = struct.session;
    for (const line of sdp) {
        if (newMediaLevel(line)) {
            struct.media[mediaCounter] = {};
            current = struct.media[mediaCounter];
            ++mediaCounter;
        }
        current = Object.assign(current, extractField(line));
    }
    return struct;
};
exports.messageFromBuffer = (buffer) => {
    return {
        type: message_1.MessageType.SDP,
        data: buffer,
        sdp: exports.parse(buffer),
    };
};
//# sourceMappingURL=sdp.js.map