/// <reference types="node" />
import { Container, Box } from './isom';
import { Sdp } from '../../../utils/protocols/sdp';
interface MoofMetadata {
    trackId: number;
    timestamp: number;
    byteLength: number;
}
interface TrackData {
    lastTimestamp: number;
    baseMediaDecodeTime: number;
    defaultFrameDuration: number;
    clockrate: number;
    bitrate: number;
    framerate: number;
    cumulativeByteLength: number;
    cumulativeDuration: number;
    cumulativeFrames: number;
}
/**
 * Create boxes for a stream initiated by an sdp object
 *
 * @class BoxBuilder
 */
export declare class BoxBuilder {
    trackIdMap: {
        [key: number]: number;
    };
    sequenceNumber: number;
    ntpPresentationTime: number;
    trackData: TrackData[];
    videoTrackId?: number;
    constructor();
    trak(settings: any): Container;
    /**
     * Creates a Moov box from the provided options.
     * @method moov
     * @param  {Object} mvhdSettings settings for the movie header box
     * @param  {Object[]} tracks track specific settings
     * @return {Moov} Moov object
     */
    moov(sdp: Sdp, date: any): Container;
    /**
     * Boxes that carry actual elementary stream fragment metadata + data.
     */
    /**
     * Creates a moof box from the provided fragment metadata.
     * @method moof
     * @param  {Object} options options containing, sequencenumber, base time, trun settings, samples
     * @return {Moof} Moof object
     */
    moof(metadata: MoofMetadata): Container;
    /**
     * Creates an mdat box containing the elementary stream data.
     * @param  {[type]} data [description]
     * @return [type]        [description]
     */
    mdat(data: Buffer): Box;
    setPresentationTime(trackId: number, ntpTimestamp?: number): void;
}
export {};
