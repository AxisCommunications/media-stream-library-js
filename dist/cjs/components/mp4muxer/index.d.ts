import { BoxBuilder } from './helpers/boxbuilder';
import { Tube } from '../component';
/**
 * Component that converts elementary stream data into MP4 boxes honouring
 * the ISO BMFF Byte Stream (Some extra restrictions are involved).
 */
export declare class Mp4Muxer extends Tube {
    boxBuilder: BoxBuilder;
    onSync?: (ntpPresentationTime: number) => void;
    /**
     * Create a new mp4muxer component.
     * @return {undefined}
     */
    constructor();
    get bitrate(): number[];
    get framerate(): number[];
    get ntpPresentationTime(): number;
}
