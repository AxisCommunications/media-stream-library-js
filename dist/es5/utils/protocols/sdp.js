var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { MessageType } from '../../components/message';
var extractLineVals = function (buffer, lineStart, start) {
    if (start === void 0) { start = 0; }
    var anchor = "\n" + lineStart;
    start = buffer.indexOf(anchor, start);
    var end = 0;
    var ret = [];
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
var newMediaLevel = function (line) {
    return line.match(/^m=/);
};
var splitOnFirst = function (c, text) {
    var p = text.indexOf(c);
    if (p < 0) {
        return [text.slice(0)];
    }
    else {
        return [text.slice(0, p), text.slice(p + 1)];
    }
};
var attributeParsers = {
    fmtp: function (value) {
        var _a = __read(splitOnFirst(' ', value), 2), format = _a[0], stringParameters = _a[1];
        switch (format) {
            default:
                var pairs = stringParameters.trim().split(';');
                var parameters_1 = {};
                pairs.forEach(function (pair) {
                    var _a = __read(splitOnFirst('=', pair), 2), key = _a[0], val = _a[1];
                    var normalizedKey = key.trim().toLowerCase();
                    if (normalizedKey !== '') {
                        parameters_1[normalizedKey] = val.trim();
                    }
                });
                return { format: format, parameters: parameters_1 };
        }
    },
    framerate: Number,
    rtpmap: function (value) {
        var _a = __read(splitOnFirst(' ', value), 2), payloadType = _a[0], encoding = _a[1];
        var _b = __read(encoding.toUpperCase().split('/'), 3), encodingName = _b[0], clockrate = _b[1], encodingParameters = _b[2];
        if (encodingParameters === undefined) {
            return {
                payloadType: Number(payloadType),
                encodingName: encodingName,
                clockrate: Number(clockrate),
            };
        }
        else {
            return {
                payloadType: Number(payloadType),
                encodingName: encodingName,
                clockrate: Number(clockrate),
                encodingParameters: encodingParameters,
            };
        }
    },
    transform: function (value) {
        return value.split(';').map(function (row) { return row.split(',').map(Number); });
    },
    framesize: function (value) {
        return value
            .split(' ')[1]
            .split('-')
            .map(Number);
    },
};
var parseAttribute = function (body) {
    var _a, _b, _c;
    var _d = __read(splitOnFirst(':', body), 2), attribute = _d[0], value = _d[1];
    if (value === undefined) {
        return _a = {}, _a[attribute] = true, _a;
    }
    else {
        if (attributeParsers[attribute] !== undefined) {
            return _b = {}, _b[attribute] = attributeParsers[attribute](value), _b;
        }
        else {
            return _c = {}, _c[attribute] = value, _c;
        }
    }
};
var extractField = function (line) {
    var prefix = line.slice(0, 1);
    var body = line.slice(2);
    switch (prefix) {
        case 'v':
            return { version: body };
        case 'o':
            var _a = __read(body.split(' '), 6), username = _a[0], sessionId = _a[1], sessionVersion = _a[2], netType = _a[3], addrType = _a[4], unicastAddress = _a[5];
            return {
                origin: {
                    addrType: addrType,
                    netType: netType,
                    sessionId: sessionId,
                    sessionVersion: sessionVersion,
                    unicastAddress: unicastAddress,
                    username: username,
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
            var _b = __read(body.split(' '), 3), connectionNetType = _b[0], connectionAddrType = _b[1], connectionAddress = _b[2];
            return {
                connectionData: {
                    addrType: connectionAddrType,
                    connectionAddress: connectionAddress,
                    netType: connectionNetType,
                },
            };
        // b=<bwtype>:<bandwidth>
        case 'b':
            var _c = __read(body.split(':'), 2), bwtype = _c[0], bandwidth = _c[1];
            return { bwtype: bwtype, bandwidth: bandwidth };
        // t=<start-time> <stop-time>
        case 't':
            var _d = __read(body.split(' ').map(Number), 2), startTime = _d[0], stopTime = _d[1];
            return { time: { startTime: startTime, stopTime: stopTime } };
        // r=<repeat interval> <active duration> <offsets from start-time>
        case 'r':
            var _e = __read(body
                .split(' ')
                .map(Number)), repeatInterval = _e[0], activeDuration = _e[1], offsets = _e.slice(2);
            return {
                repeatTimes: { repeatInterval: repeatInterval, activeDuration: activeDuration, offsets: offsets },
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
            var _f = __read(body.split(' '), 4), type = _f[0], port = _f[1], protocol = _f[2], fmt = _f[3];
            return { type: type, port: Number(port), protocol: protocol, fmt: Number(fmt) };
        default:
        // console.log('unknown SDP prefix ', prefix);
    }
};
export var extractURIs = function (buffer) {
    // There is a control URI above the m= line, which should not be used
    var seekFrom = buffer.indexOf('\nm=');
    return extractLineVals(buffer, 'a=control:', seekFrom);
};
/**
 * Create an array of sprop-parameter-sets elements
 * @param  {Buffer} buffer The buffer containing the sdp data
 * @return {Array}         The differen parameter strings
 */
export var parse = function (buffer) {
    var e_1, _a;
    var sdp = buffer
        .toString('ascii')
        .split('\n')
        .map(function (s) { return s.trim(); });
    var struct = { session: {}, media: [] };
    var mediaCounter = 0;
    var current = struct.session;
    try {
        for (var sdp_1 = __values(sdp), sdp_1_1 = sdp_1.next(); !sdp_1_1.done; sdp_1_1 = sdp_1.next()) {
            var line = sdp_1_1.value;
            if (newMediaLevel(line)) {
                struct.media[mediaCounter] = {};
                current = struct.media[mediaCounter];
                ++mediaCounter;
            }
            current = Object.assign(current, extractField(line));
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (sdp_1_1 && !sdp_1_1.done && (_a = sdp_1.return)) _a.call(sdp_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return struct;
};
export var messageFromBuffer = function (buffer) {
    return {
        type: MessageType.SDP,
        data: buffer,
        sdp: parse(buffer),
    };
};
//# sourceMappingURL=sdp.js.map