import { Tube } from '../component';
/**
 * A component that converts raw binary data into RTP/RTSP/RTCP packets on the
 * incoming stream, and converts RTSP commands to raw binary data on the outgoing
 * stream. The component is agnostic of any RTSP session details (you need an
 * RTSP session component in the pipeline).
 * @extends {Component}
 */
export declare class RtspParser extends Tube {
    /**
     * Create a new RTSP parser component.
     * @return {undefined}
     */
    constructor();
}
