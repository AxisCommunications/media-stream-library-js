import { merge } from '../../utils/config';
// Time in milliseconds we want to wait for a websocket to open
var WEBSOCKET_TIMEOUT = 10007;
// Default configuration
var defaultConfig = function (host, scheme) {
    if (host === void 0) { host = window.location.host; }
    if (scheme === void 0) { scheme = window.location.protocol; }
    var wsScheme = scheme === 'https:' ? 'wss:' : 'ws:';
    return {
        uri: wsScheme + "//" + host + "/rtsp-over-websocket",
        tokenUri: scheme + "//" + host + "/axis-cgi/rtspwssession.cgi",
        protocol: 'binary',
        timeout: WEBSOCKET_TIMEOUT,
    };
};
/**
 * Open a new WebSocket, fallback to token-auth on failure and retry.
 * @param  {Object} [config={}]  WebSocket configuration.
 * @param  {String} [config.host]  Specify different host
 * @param  {String} [config.sheme]  Specify different scheme.
 * @param  {String} [config.uri]  Full uri for websocket connection
 * @param  {String} [config.tokenUri]  Full uri for token API
 * @param  {String} [config.protocol] Websocket protocol
 * @param  {Number} [config.timeout] Websocket connection timeout
 * @return {Promise}  Resolves with WebSocket, rejects with error.
 */
export var openWebSocket = function (config) {
    if (config === void 0) { config = {}; }
    var _a = merge(defaultConfig(config.host, config.scheme), config), uri = _a.uri, tokenUri = _a.tokenUri, protocol = _a.protocol, timeout = _a.timeout;
    if (uri === undefined) {
        throw new Error('ws: internal error');
    }
    return new Promise(function (resolve, reject) {
        try {
            var ws_1 = new WebSocket(uri, protocol);
            var countdown_1 = setTimeout(function () {
                clearTimeout(countdown_1);
                if (ws_1.readyState === WebSocket.CONNECTING) {
                    ws_1.onerror = null;
                    reject(new Error('websocket connection timed out'));
                }
            }, timeout);
            ws_1.binaryType = 'arraybuffer';
            ws_1.onerror = function (originalError) {
                clearTimeout(countdown_1);
                // try fetching an authentication token
                function onLoadToken() {
                    if (this.status >= 400) {
                        console.warn('failed to load token', this.status, this.responseText);
                        reject(originalError);
                        return;
                    }
                    var token = this.responseText.trim();
                    // We have a token! attempt to open a WebSocket again.
                    var newUri = uri + "?rtspwssession=" + token;
                    var ws2 = new WebSocket(newUri, protocol);
                    ws2.binaryType = 'arraybuffer';
                    ws2.onerror = function (err) {
                        reject(err);
                    };
                    ws2.onopen = function () { return resolve(ws2); };
                }
                var request = new XMLHttpRequest();
                request.addEventListener('load', onLoadToken);
                request.addEventListener('error', function (err) {
                    console.warn('failed to get token');
                    reject(err);
                });
                request.addEventListener('abort', function () { return reject(originalError); });
                request.open('GET', tokenUri + "?" + Date.now());
                try {
                    request.send();
                }
                catch (error) {
                    reject(originalError);
                }
            };
            ws_1.onopen = function () {
                clearTimeout(countdown_1);
                resolve(ws_1);
            };
        }
        catch (e) {
            reject(e);
        }
    });
};
//# sourceMappingURL=openwebsocket.js.map