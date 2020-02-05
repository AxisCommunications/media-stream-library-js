/**
 * Generate frame and scan headers that can be prepended to the
 * RTP/JPEG data payload to produce a JPEG compressed image in
 * interchange format.
 *
 * For detailed information, check Appendix A of:
 * https://tools.ietf.org/html/rfc2435
 */
/// <reference types="node" />
export declare function makeImageHeader(): Buffer;
export declare function makeQuantHeader(precision: number, qTable: Buffer): Buffer;
export declare function makeFrameHeader(width: number, height: number, type: number): Buffer;
export declare function makeHuffmanHeader(): Buffer;
export declare function makeScanHeader(): Buffer;
