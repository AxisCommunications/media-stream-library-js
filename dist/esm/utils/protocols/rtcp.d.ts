/// <reference types="node" />
export declare const version: (buffer: Buffer) => number;
export declare const padding: (buffer: Buffer) => boolean;
export declare const count: (buffer: Buffer) => number;
export declare const packetType: (buffer: Buffer) => number;
export declare const length: (buffer: Buffer) => number;
export declare const SR: {
    packetType: number;
    syncSource: (buffer: Buffer) => number;
    ntpMost: (buffer: Buffer) => number;
    ntpLeast: (buffer: Buffer) => number;
    rtpTimestamp: (buffer: Buffer) => number;
    sendersPacketCount: (buffer: Buffer) => number;
    sendersOctetCount: (buffer: Buffer) => number;
};
export declare const RR: {
    packetType: number;
};
export declare const SDES: {
    packetType: number;
};
export declare const BYE: {
    packetType: number;
};
export declare const APP: {
    packetType: number;
};
