import debug from 'debug';
const DEFAULT_PROTOCOL = 'RTSP/1.0';
export const builder = (msg) => {
    if (!msg.method || !msg.uri) {
        throw new Error('message needs to contain a method and a uri');
    }
    const protocol = msg.protocol || DEFAULT_PROTOCOL;
    const headers = msg.headers || {};
    const messageString = [
        `${msg.method} ${msg.uri} ${protocol}`,
        Object.entries(headers)
            .map(([key, value]) => key + ': ' + value)
            .join('\r\n'),
        '\r\n',
    ].join('\r\n');
    debug('msl:rtsp:outgoing')(messageString);
    return Buffer.from(messageString);
};
//# sourceMappingURL=builder.js.map