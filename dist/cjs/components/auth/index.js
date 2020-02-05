"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../utils/config");
const rtsp_1 = require("../../utils/protocols/rtsp");
const component_1 = require("../component");
const message_1 = require("../message");
const messageStreams_1 = require("../messageStreams");
const digest_1 = require("./digest");
const www_authenticate_1 = require("./www-authenticate");
const UNAUTHORIZED = 401;
const DEFAULT_CONFIG = {
    username: 'root',
    password: 'pass',
};
/*
 * This component currently only supports Basic authentication
 * It should be placed between the RTSP parser and the RTSP Session.
 */
class Auth extends component_1.Tube {
    constructor(config = {}) {
        const { username, password } = config_1.merge(DEFAULT_CONFIG, config);
        if (username === undefined || password === undefined) {
            throw new Error('need username and password');
        }
        let lastSentMessage;
        let authHeader;
        const outgoing = messageStreams_1.createTransform(function (msg, encoding, callback) {
            if (msg.type === message_1.MessageType.RTSP) {
                lastSentMessage = msg;
                if (authHeader && msg.headers) {
                    msg.headers.Authorization = authHeader;
                }
            }
            callback(undefined, msg);
        });
        const incoming = messageStreams_1.createTransform(function (msg, encoding, callback) {
            if (msg.type === message_1.MessageType.RTSP &&
                rtsp_1.statusCode(msg.data) === UNAUTHORIZED) {
                const headers = msg.data.toString().split('\n');
                const wwwAuth = headers.find(header => /WWW-Auth/i.test(header));
                if (wwwAuth === undefined) {
                    throw new Error('cannot find WWW-Authenticate header');
                }
                const challenge = www_authenticate_1.parseWWWAuthenticate(wwwAuth);
                if (challenge.type === 'basic') {
                    authHeader =
                        'Basic ' + Buffer.from(username + ':' + password).toString('base64');
                }
                else if (challenge.type === 'digest') {
                    const digest = new digest_1.DigestAuth(challenge.params, username, password);
                    authHeader = digest.authorization(lastSentMessage.method, lastSentMessage.uri);
                }
                else {
                    // unkown authentication type, give up
                    return;
                }
                // Retry last RTSP message
                // Write will fire our outgoing transform function.
                outgoing.write(lastSentMessage, () => callback());
            }
            else {
                // Not a message we should handle
                callback(undefined, msg);
            }
        });
        super(incoming, outgoing);
    }
}
exports.Auth = Auth;
//# sourceMappingURL=index.js.map