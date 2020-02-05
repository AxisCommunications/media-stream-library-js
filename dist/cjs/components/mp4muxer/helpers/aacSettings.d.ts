import { AACMedia } from '../../../utils/protocols/sdp';
import { Box, Container } from './isom';
export interface AACEncoding {
    coding: string;
    samplingRate: string;
    channels: string;
}
export declare const aacSettings: (media: AACMedia, date: number, trackId: number) => {
    tkhd: {
        track_ID: number;
        creation_time: number;
        modification_time: number;
        width: number;
        height: number;
        volume: number;
    };
    mdhd: {
        timescale: number;
        creation_time: number;
        modification_time: number;
        duration: number;
    };
    hdlr: {
        handler_type: string;
        name: string;
    };
    mediaHeaderBox: Box;
    sampleEntryBox: Container;
    defaultFrameDuration: number;
    mime: string;
    codec: AACEncoding;
};
