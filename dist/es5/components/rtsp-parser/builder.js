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
import debug from 'debug';
var DEFAULT_PROTOCOL = 'RTSP/1.0';
export var builder = function (msg) {
    if (!msg.method || !msg.uri) {
        throw new Error('message needs to contain a method and a uri');
    }
    var protocol = msg.protocol || DEFAULT_PROTOCOL;
    var headers = msg.headers || {};
    var messageString = [
        msg.method + " " + msg.uri + " " + protocol,
        Object.entries(headers)
            .map(function (_a) {
            var _b = __read(_a, 2), key = _b[0], value = _b[1];
            return key + ': ' + value;
        })
            .join('\r\n'),
        '\r\n',
    ].join('\r\n');
    debug('msl:rtsp:outgoing')(messageString);
    return Buffer.from(messageString);
};
//# sourceMappingURL=builder.js.map