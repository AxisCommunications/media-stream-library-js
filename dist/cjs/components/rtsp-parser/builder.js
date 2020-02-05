"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const DEFAULT_PROTOCOL = 'RTSP/1.0';
exports.builder = (msg) => {
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
    debug_1.default('msl:rtsp:outgoing')(messageString);
    return Buffer.from(messageString);
};
//# sourceMappingURL=builder.js.map