import { merge } from '../../utils/config';
import { statusCode } from '../../utils/protocols/rtsp';
import { Tube } from '../component';
import { MessageType } from '../message';
import { createTransform } from '../messageStreams';
import { DigestAuth } from './digest';
import { parseWWWAuthenticate } from './www-authenticate';
const UNAUTHORIZED = 401;
const DEFAULT_CONFIG = {
    username: 'root',
    password: 'pass',
};
/*
 * This component currently only supports Basic authentication
 * It should be placed between the RTSP parser and the RTSP Session.
 */
export class Auth extends Tube {
    constructor(config = {}) {
        const { username, password } = merge(DEFAULT_CONFIG, config);
        if (username === undefined || password === undefined) {
            throw new Error('need username and password');
        }
        let lastSentMessage;
        let authHeader;
        const outgoing = createTransform(function (msg, encoding, callback) {
            if (msg.type === MessageType.RTSP) {
                lastSentMessage = msg;
                if (authHeader && msg.headers) {
                    msg.headers.Authorization = authHeader;
                }
            }
            callback(undefined, msg);
        });
        const incoming = createTransform(function (msg, encoding, callback) {
            if (msg.type === MessageType.RTSP &&
                statusCode(msg.data) === UNAUTHORIZED) {
                const headers = msg.data.toString().split('\n');
                const wwwAuth = headers.find(header => /WWW-Auth/i.test(header));
                if (wwwAuth === undefined) {
                    throw new Error('cannot find WWW-Authenticate header');
                }
                const challenge = parseWWWAuthenticate(wwwAuth);
                if (challenge.type === 'basic') {
                    authHeader =
                        'Basic ' + Buffer.from(username + ':' + password).toString('base64');
                }
                else if (challenge.type === 'digest') {
                    const digest = new DigestAuth(challenge.params, username, password);
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
//# sourceMappingURL=index.js.map