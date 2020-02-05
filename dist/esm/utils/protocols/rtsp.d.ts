/// <reference types="node" />
export declare const extractHeaderValue: (buffer: Buffer, header: string) => string | null;
export declare const sequence: (buffer: Buffer) => number | null;
export declare const sessionId: (buffer: Buffer) => string | null;
export declare const sessionTimeout: (buffer: Buffer) => number | null;
export declare const statusCode: (buffer: Buffer) => number;
export declare const contentBase: (buffer: Buffer) => string | null;
export declare const connectionEnded: (buffer: Buffer) => boolean;
export declare const range: (buffer: Buffer) => string[] | undefined;
/**
 * Determine the offset of the RTSP body, where the header ends.
 * If there is no header ending, -1 is returned
 * @param {Buffer} chunk A piece of data
 * @return {Number}      The body offset, or -1 if no header end found
 */
export declare const bodyOffset: (chunk: Buffer) => number;
