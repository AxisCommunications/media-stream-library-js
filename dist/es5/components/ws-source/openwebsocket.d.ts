export interface WSConfig {
    host?: string;
    scheme?: string;
    uri?: string;
    tokenUri?: string;
    protocol?: string;
    timeout?: number;
}
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
export declare const openWebSocket: (config?: WSConfig) => Promise<WebSocket>;
