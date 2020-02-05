import { H264Media } from '../../../utils/protocols/sdp';
import { Box, Container } from './isom';
export declare const h264Settings: (media: H264Media, date: number, trackId: number) => {
    mediaHeaderBox: Box;
    sampleEntryBox: Container;
    tkhd: {
        track_ID: number;
        creation_time: number;
        modification_time: number;
        width: number;
        height: number;
        volume: number;
    };
    hdlr: {};
    mdhd: {
        timescale: number;
        creation_time: number;
        modification_time: number;
        duration: number;
    };
    defaultFrameDuration: number;
    mime: string;
    codec: {
        coding: string;
        profile: string;
        level: string;
    };
};
