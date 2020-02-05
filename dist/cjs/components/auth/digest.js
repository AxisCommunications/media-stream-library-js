"use strict";
// https://tools.ietf.org/html/rfc2617#section-3.2.1
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const md5_js_1 = __importDefault(require("md5.js"));
class DigestAuth {
    constructor(params, username, password) {
        this.nc = () => {
            ++this.count;
            return this.count.toString(16).padStart(8, '0');
        };
        this.cnonce = () => {
            return new Array(4)
                .fill(0)
                .map(() => Math.floor(Math.random() * 256))
                .map(n => n.toString(16))
                .join('');
        };
        this.ha1 = (cnonce) => {
            let ha1 = this.ha1Base;
            if (this.algorithm === 'md5-sess') {
                ha1 = new md5_js_1.default().update(`${ha1}:${this.nonce}:${cnonce}`).digest('hex');
            }
            return ha1;
        };
        this.ha2 = (method, uri, body = '') => {
            let ha2 = new md5_js_1.default().update(`${method}:${uri}`).digest('hex');
            if (this.algorithm === 'md5-sess') {
                const hbody = new md5_js_1.default().update(body).digest('hex');
                ha2 = new md5_js_1.default().update(`${method}:${uri}:${hbody}`).digest('hex');
            }
            return ha2;
        };
        this.authorization = (method = 'GET', uri = '', body) => {
            // Increase count
            const nc = this.nc();
            const cnonce = this.cnonce();
            const ha1 = this.ha1(cnonce);
            const ha2 = this.ha2(method, uri, body);
            const response = this.qop === undefined
                ? new md5_js_1.default().update(`${ha1}:${this.nonce}:${ha2}`).digest('hex')
                : new md5_js_1.default()
                    .update(`${ha1}:${this.nonce}:${nc}:${cnonce}:${this.qop}:${ha2}`)
                    .digest('hex');
            const authorizationParams = [];
            authorizationParams.push(`username="${this.username}"`);
            authorizationParams.push(`realm="${this.realm}"`);
            authorizationParams.push(`nonce="${this.nonce}"`);
            authorizationParams.push(`uri="${uri}"`);
            if (this.qop !== undefined) {
                authorizationParams.push(`qop=${this.qop}`);
                authorizationParams.push(`nc=${nc}`);
                authorizationParams.push(`cnonce="${cnonce}"`);
            }
            authorizationParams.push(`response="${response}"`);
            if (this.opaque !== undefined) {
                authorizationParams.push(`opaque="${this.opaque}"`);
            }
            return `Digest ${authorizationParams.join(', ')}`;
        };
        const realm = params.get('realm');
        if (realm === undefined) {
            throw new Error('no realm in digest challenge');
        }
        this.realm = realm;
        this.ha1Base = new md5_js_1.default()
            .update(`${username}:${realm}:${password}`)
            .digest('hex');
        const nonce = params.get('nonce');
        if (nonce === undefined) {
            throw new Error('no nonce in digest challenge');
        }
        this.nonce = nonce;
        this.opaque = params.get('opaque');
        const algorithm = params.get('algorithm');
        if (algorithm !== undefined) {
            if (algorithm === 'md5') {
                this.algorithm = 'md5';
            }
            else if (algorithm === 'md5-sess') {
                this.algorithm = 'md5-sess';
            }
        }
        else {
            this.algorithm = 'md5';
        }
        const qop = params.get('qop');
        if (qop !== undefined) {
            const possibleQops = qop.split(',').map(qopType => qopType.trim());
            if (possibleQops.some(qopValue => qopValue === 'auth')) {
                this.qop = 'auth';
            }
            else if (possibleQops.some(qopValue => qopValue === 'auth-int')) {
                this.qop = 'auth-int';
            }
        }
        this.count = 0;
        this.username = username;
    }
}
exports.DigestAuth = DigestAuth;
//# sourceMappingURL=digest.js.map