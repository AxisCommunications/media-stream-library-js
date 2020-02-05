/// <reference types="node" />
import { SdpMessage } from '../../components/message';
import { NtpSeconds, seconds } from './ntp';
interface ConnectionField {
    networkType: 'IN';
    addressType: 'IP4' | 'IP6';
    connectionAddress: string;
}
interface BandwidthField {
    readonly type: string;
    readonly value: number;
}
interface RtspExtensions {
    readonly range?: string;
    readonly control?: string;
    readonly mtag?: string;
}
/**
 * The session description protocol (SDP).
 *
 * Contains parser to convert SDP data into an SDP structure.
 * https://tools.ietf.org/html/rfc4566
 *
 * NOTE: not all SDP attributes have been implemented,
 * and in some cases the handling of attributes has been
 * simplified to not cover multiple identical attributes.
 */
/**
 * Session description
 *
 * Optional items are marked with a '*'.
 *
 * v=  (protocol version)
 * o=  (owner/creator and session identifier).
 * s=  (session name)
 * i=* (session information)
 * u=* (URI of description)
 * e=* (email address)
 * p=* (phone number)
 * c=* (connection information - not required if included in all media)
 * b=* (bandwidth information)
 * One or more time descriptions (see below)
 * z=* (time zone adjustments)
 * k=* (encryption key)
 * a=* (zero or more session attribute lines)
 * Zero or more media descriptions (see below)
 *
 * Names of the fields below are annotated above with
 * the names used in Appendix A: SDP Grammar of RFC 2327.
 */
export interface SessionDescription extends RtspExtensions {
    readonly version: 0;
    readonly originField: OriginField;
    readonly name: string;
    readonly description?: string;
    readonly uri?: string;
    readonly email?: string | string[];
    readonly phone?: string | string[];
    readonly connection?: ConnectionField;
    readonly bandwidth?: BandwidthField;
    readonly time: TimeDescription;
    readonly repeatTimes?: RepeatTimeDescription;
    readonly media: MediaDescription[];
}
interface OriginField {
    username: string;
    sessionId: number;
    sessionVersion: number;
    networkType: 'IN';
    addressType: 'IP4' | 'IP6';
    address: string;
}
/**
 * Time description
 *
 * t=  (time the session is active)
 * r=* (zero or more repeat times)
 */
export interface TimeDescription {
    readonly startTime: NtpSeconds;
    readonly stopTime: NtpSeconds;
}
export interface RepeatTimeDescription {
    readonly repeatInterval: seconds;
    readonly activeDuration: seconds;
    readonly offsets: seconds[];
}
/**
 * Media description
 *
 * m=  (media name and transport address)
 * i=* (media title)
 * c=* (connection information -- optional if included at session level)
 * b=* (zero or more bandwidth information lines)
 * k=* (encryption key)
 * a=* (zero or more media attribute lines)
 *
 * The parser only handles a single fmt value
 * and only one rtpmap attribute (in theory there
 * can be multiple fmt values with corresponding rtpmap
 * attributes)
 */
export interface MediaDescription extends RtspExtensions {
    readonly type: 'audio' | 'video' | 'application' | 'data' | 'control';
    readonly port: number;
    readonly protocol: 'udp' | 'RTP/AVP' | 'RTP/SAVP';
    readonly fmt: number;
    readonly connection?: ConnectionField;
    readonly bandwidth?: BandwidthField;
    /**
     * Any remaining attributes
     * a=...
     */
    readonly rtpmap?: {
        readonly clockrate: number;
        readonly encodingName: string;
        readonly payloadType: number;
    };
    readonly fmtp: {
        readonly format: string;
        readonly parameters: {
            [key: string]: any;
        };
    };
    mime?: string;
    codec?: any;
}
export interface VideoMedia extends MediaDescription {
    readonly type: 'video';
    readonly framerate?: number;
    readonly transform?: number[][];
    readonly framesize?: [number, number];
}
export interface H264Media extends VideoMedia {
    readonly rtpmap: {
        readonly clockrate: number;
        readonly encodingName: string;
        readonly payloadType: number;
    };
}
export interface AudioMedia extends MediaDescription {
    readonly type: 'audio';
}
export interface AACParameters {
    readonly bitrate: string;
    readonly config: string;
    readonly indexdeltalength: string;
    readonly indexlength: string;
    readonly mode: 'AAC-hbr';
    readonly 'profile-level-id': string;
    readonly sizelength: string;
    readonly streamtype: string;
    readonly ctsdeltalength: string;
    readonly dtsdeltalength: string;
    readonly randomaccessindication: string;
    readonly streamstateindication: string;
    readonly auxiliarydatasizelength: string;
}
export interface AACMedia extends AudioMedia {
    readonly fmtp: {
        readonly format: string;
        readonly parameters: AACParameters;
    };
    readonly rtpmap: {
        readonly clockrate: number;
        readonly encodingName: string;
        readonly payloadType: number;
    };
}
export interface Sdp {
    readonly session: SessionDescription;
    readonly media: MediaDescription[];
}
export declare const extractURIs: (buffer: Buffer) => string[];
/**
 * Create an array of sprop-parameter-sets elements
 * @param  {Buffer} buffer The buffer containing the sdp data
 * @return {Array}         The differen parameter strings
 */
export declare const parse: (buffer: Buffer) => Sdp;
export declare const messageFromBuffer: (buffer: Buffer) => SdpMessage;
export {};
