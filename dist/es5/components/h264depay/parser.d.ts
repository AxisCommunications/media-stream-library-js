/// <reference types="node" />
import { RtpMessage, H264Message } from '../message';
export declare enum NAL_TYPES {
    UNSPECIFIED = 0,
    NON_IDR_PICTURE = 1,
    IDR_PICTURE = 5,
    SPS = 7,
    PPS = 8
}
export declare function h264depay(buffered: Buffer, rtp: RtpMessage, callback: (msg: H264Message) => void): Buffer;
