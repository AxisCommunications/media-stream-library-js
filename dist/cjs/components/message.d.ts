/// <reference types="node" />
import { Sdp } from '../utils/protocols/sdp';
export interface GenericMessage {
    readonly type: MessageType;
    readonly data: Buffer;
    ntpTimestamp?: number;
}
export declare enum MessageType {
    UNKNOWN = 0,
    RAW = 1,
    RTP = 2,
    RTCP = 3,
    RTSP = 4,
    SDP = 5,
    ELEMENTARY = 6,
    H264 = 7,
    ISOM = 8,
    XML = 9,
    JPEG = 10
}
export interface RawMessage extends GenericMessage {
    readonly type: MessageType.RAW;
}
export interface RtpMessage extends GenericMessage {
    readonly type: MessageType.RTP;
    readonly channel: number;
}
export interface RtcpMessage extends GenericMessage {
    readonly type: MessageType.RTCP;
    readonly channel: number;
}
export interface RtspMessage extends GenericMessage {
    readonly type: MessageType.RTSP;
    readonly method?: string;
    readonly headers?: {
        [key: string]: string;
    };
    readonly uri?: string;
    readonly protocol?: string;
}
export interface SdpMessage extends GenericMessage {
    readonly type: MessageType.SDP;
    readonly sdp: Sdp;
}
export interface ElementaryMessage extends GenericMessage {
    readonly type: MessageType.ELEMENTARY;
    readonly payloadType: number;
    readonly timestamp: number;
}
export interface H264Message extends GenericMessage {
    readonly type: MessageType.H264;
    readonly payloadType: number;
    readonly timestamp: number;
    readonly nalType: number;
}
export interface IsomMessage extends GenericMessage {
    readonly type: MessageType.ISOM;
    readonly checkpointTime?: number;
}
export interface XmlMessage extends GenericMessage {
    readonly type: MessageType.XML;
    readonly timestamp: number;
    readonly payloadType: number;
}
export interface JpegMessage extends GenericMessage {
    readonly type: MessageType.JPEG;
    readonly timestamp: number;
    readonly payloadType: number;
    readonly framesize: {
        readonly width: number;
        readonly height: number;
    };
}
export declare type Message = RawMessage | RtpMessage | RtcpMessage | RtspMessage | SdpMessage | ElementaryMessage | H264Message | IsomMessage | XmlMessage | JpegMessage;
export declare type MessageHandler = (msg: GenericMessage) => void;
