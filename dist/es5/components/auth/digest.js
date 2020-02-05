// https://tools.ietf.org/html/rfc2617#section-3.2.1
import MD5 from 'md5.js';
var DigestAuth = /** @class */ (function () {
    function DigestAuth(params, username, password) {
        var _this = this;
        this.nc = function () {
            ++_this.count;
            return _this.count.toString(16).padStart(8, '0');
        };
        this.cnonce = function () {
            return new Array(4)
                .fill(0)
                .map(function () { return Math.floor(Math.random() * 256); })
                .map(function (n) { return n.toString(16); })
                .join('');
        };
        this.ha1 = function (cnonce) {
            var ha1 = _this.ha1Base;
            if (_this.algorithm === 'md5-sess') {
                ha1 = new MD5().update(ha1 + ":" + _this.nonce + ":" + cnonce).digest('hex');
            }
            return ha1;
        };
        this.ha2 = function (method, uri, body) {
            if (body === void 0) { body = ''; }
            var ha2 = new MD5().update(method + ":" + uri).digest('hex');
            if (_this.algorithm === 'md5-sess') {
                var hbody = new MD5().update(body).digest('hex');
                ha2 = new MD5().update(method + ":" + uri + ":" + hbody).digest('hex');
            }
            return ha2;
        };
        this.authorization = function (method, uri, body) {
            if (method === void 0) { method = 'GET'; }
            if (uri === void 0) { uri = ''; }
            // Increase count
            var nc = _this.nc();
            var cnonce = _this.cnonce();
            var ha1 = _this.ha1(cnonce);
            var ha2 = _this.ha2(method, uri, body);
            var response = _this.qop === undefined
                ? new MD5().update(ha1 + ":" + _this.nonce + ":" + ha2).digest('hex')
                : new MD5()
                    .update(ha1 + ":" + _this.nonce + ":" + nc + ":" + cnonce + ":" + _this.qop + ":" + ha2)
                    .digest('hex');
            var authorizationParams = [];
            authorizationParams.push("username=\"" + _this.username + "\"");
            authorizationParams.push("realm=\"" + _this.realm + "\"");
            authorizationParams.push("nonce=\"" + _this.nonce + "\"");
            authorizationParams.push("uri=\"" + uri + "\"");
            if (_this.qop !== undefined) {
                authorizationParams.push("qop=" + _this.qop);
                authorizationParams.push("nc=" + nc);
                authorizationParams.push("cnonce=\"" + cnonce + "\"");
            }
            authorizationParams.push("response=\"" + response + "\"");
            if (_this.opaque !== undefined) {
                authorizationParams.push("opaque=\"" + _this.opaque + "\"");
            }
            return "Digest " + authorizationParams.join(', ');
        };
        var realm = params.get('realm');
        if (realm === undefined) {
            throw new Error('no realm in digest challenge');
        }
        this.realm = realm;
        this.ha1Base = new MD5()
            .update(username + ":" + realm + ":" + password)
            .digest('hex');
        var nonce = params.get('nonce');
        if (nonce === undefined) {
            throw new Error('no nonce in digest challenge');
        }
        this.nonce = nonce;
        this.opaque = params.get('opaque');
        var algorithm = params.get('algorithm');
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
        var qop = params.get('qop');
        if (qop !== undefined) {
            var possibleQops = qop.split(',').map(function (qopType) { return qopType.trim(); });
            if (possibleQops.some(function (qopValue) { return qopValue === 'auth'; })) {
                this.qop = 'auth';
            }
            else if (possibleQops.some(function (qopValue) { return qopValue === 'auth-int'; })) {
                this.qop = 'auth-int';
            }
        }
        this.count = 0;
        this.username = username;
    }
    return DigestAuth;
}());
export { DigestAuth };
//# sourceMappingURL=digest.js.map