import { ElementaryMessage, RtpMessage } from '../message';
export declare function parse(rtp: RtpMessage, hasHeader: boolean, callback: (msg: ElementaryMessage) => void): void;
