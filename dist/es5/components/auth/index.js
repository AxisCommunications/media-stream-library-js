var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { merge } from '../../utils/config';
import { statusCode } from '../../utils/protocols/rtsp';
import { Tube } from '../component';
import { MessageType } from '../message';
import { createTransform } from '../messageStreams';
import { DigestAuth } from './digest';
import { parseWWWAuthenticate } from './www-authenticate';
var UNAUTHORIZED = 401;
var DEFAULT_CONFIG = {
    username: 'root',
    password: 'pass',
};
/*
 * This component currently only supports Basic authentication
 * It should be placed between the RTSP parser and the RTSP Session.
 */
var Auth = /** @class */ (function (_super) {
    __extends(Auth, _super);
    function Auth(config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        var _a = merge(DEFAULT_CONFIG, config), username = _a.username, password = _a.password;
        if (username === undefined || password === undefined) {
            throw new Error('need username and password');
        }
        var lastSentMessage;
        var authHeader;
        var outgoing = createTransform(function (msg, encoding, callback) {
            if (msg.type === MessageType.RTSP) {
                lastSentMessage = msg;
                if (authHeader && msg.headers) {
                    msg.headers.Authorization = authHeader;
                }
            }
            callback(undefined, msg);
        });
        var incoming = createTransform(function (msg, encoding, callback) {
            if (msg.type === MessageType.RTSP &&
                statusCode(msg.data) === UNAUTHORIZED) {
                var headers = msg.data.toString().split('\n');
                var wwwAuth = headers.find(function (header) { return /WWW-Auth/i.test(header); });
                if (wwwAuth === undefined) {
                    throw new Error('cannot find WWW-Authenticate header');
                }
                var challenge = parseWWWAuthenticate(wwwAuth);
                if (challenge.type === 'basic') {
                    authHeader =
                        'Basic ' + Buffer.from(username + ':' + password).toString('base64');
                }
                else if (challenge.type === 'digest') {
                    var digest = new DigestAuth(challenge.params, username, password);
                    authHeader = digest.authorization(lastSentMessage.method, lastSentMessage.uri);
                }
                else {
                    // unkown authentication type, give up
                    return;
                }
                // Retry last RTSP message
                // Write will fire our outgoing transform function.
                outgoing.write(lastSentMessage, function () { return callback(); });
            }
            else {
                // Not a message we should handle
                callback(undefined, msg);
            }
        });
        _this = _super.call(this, incoming, outgoing) || this;
        return _this;
    }
    return Auth;
}(Tube));
export { Auth };
//# sourceMappingURL=index.js.map