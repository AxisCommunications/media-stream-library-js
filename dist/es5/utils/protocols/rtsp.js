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
export var extractHeaderValue = function (buffer, header) {
    var anchor = "\n" + header + ": ";
    var start = buffer.indexOf(anchor);
    if (start >= 0) {
        var end = buffer.indexOf('\n', start + anchor.length);
        var headerValue = buffer
            .toString('ascii', start + anchor.length, end)
            .trim();
        return headerValue;
    }
    return null;
};
export var sequence = function (buffer) {
    var val = extractHeaderValue(buffer, 'CSeq');
    if (val !== null) {
        return Number(val);
    }
    return null;
};
export var sessionId = function (buffer) {
    var val = extractHeaderValue(buffer, 'Session');
    return val ? val.split(';')[0] : null;
};
export var sessionTimeout = function (buffer) {
    var val = extractHeaderValue(buffer, 'Session');
    if (val === null) {
        return null;
    }
    var timeoutToken = 'timeout=';
    var timeoutPosition = val.indexOf(timeoutToken);
    if (timeoutPosition !== -1) {
        var timeoutVal = val.substring(timeoutPosition + timeoutToken.length);
        timeoutVal = timeoutVal.split(';')[0];
        var parsedTimeout = parseInt(timeoutVal);
        return isNaN(parsedTimeout) ? null : parsedTimeout;
    }
    return null;
};
export var statusCode = function (buffer) {
    return Number(buffer.toString('ascii', 9, 12));
};
export var contentBase = function (buffer) {
    return extractHeaderValue(buffer, 'Content-Base');
};
export var connectionEnded = function (buffer) {
    return extractHeaderValue(buffer, 'Connection') === 'close';
};
export var range = function (buffer) {
    // Possible range headers:
    // Range: npt=now-
    // Range: npt=1154.598701-3610.259146
    var npt = extractHeaderValue(buffer, 'Range');
    if (npt !== null) {
        return npt.split('=')[1].split('-');
    }
    return undefined;
};
/**
 * Determine the offset of the RTSP body, where the header ends.
 * If there is no header ending, -1 is returned
 * @param {Buffer} chunk A piece of data
 * @return {Number}      The body offset, or -1 if no header end found
 */
export var bodyOffset = function (chunk) {
    var bodyOffsets = ['\n\n', '\r\r', '\r\n\r\n']
        .map(function (s) {
        var offset = chunk.indexOf(s);
        if (offset !== -1) {
            return offset + s.length;
        }
        return offset;
    })
        .filter(function (offset) { return offset !== -1; });
    if (bodyOffsets.length > 0) {
        return bodyOffsets.reduce(function (acc, offset) {
            return Math.min(acc, offset);
        });
    }
    else {
        return -1;
    }
};
//# sourceMappingURL=rtsp.js.map