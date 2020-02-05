"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isom_1 = require("./isom");
const aacSettings_1 = require("./aacSettings");
const h264Settings_1 = require("./h264Settings");
const formatDefaults = {
    'MPEG4-GENERIC': aacSettings_1.aacSettings,
    H264: h264Settings_1.h264Settings,
};
const createTrackData = () => {
    return {
        lastTimestamp: 0,
        baseMediaDecodeTime: 0,
        defaultFrameDuration: 0,
        clockrate: 0,
        bitrate: 0,
        framerate: 0,
        cumulativeByteLength: 0,
        cumulativeDuration: 0,
        cumulativeFrames: 0,
    };
};
const updateRateInfo = (trackData, { byteLength, duration }) => {
    trackData.cumulativeByteLength += byteLength;
    trackData.cumulativeDuration += duration;
    trackData.cumulativeFrames++;
    // Update the cumulative number size (bytes) and duration (ticks), and if
    // the duration exceeds the clockrate (meaning longer than 1 second of data),
    // then compute a new bitrate and reset cumulative size and duration.
    if (trackData.cumulativeDuration >= trackData.clockrate) {
        const bits = 8 * trackData.cumulativeByteLength;
        const frames = trackData.cumulativeFrames;
        const seconds = trackData.cumulativeDuration / trackData.clockrate;
        trackData.bitrate = bits / seconds;
        trackData.framerate = frames / seconds;
        trackData.cumulativeByteLength = 0;
        trackData.cumulativeDuration = 0;
        trackData.cumulativeFrames = 0;
    }
};
/**
 * Create boxes for a stream initiated by an sdp object
 *
 * @class BoxBuilder
 */
class BoxBuilder {
    constructor() {
        this.trackIdMap = {};
        this.sequenceNumber = 0;
        this.ntpPresentationTime = 0;
        this.trackData = [];
    }
    trak(settings) {
        const trak = new isom_1.Container('trak');
        const mdia = new isom_1.Container('mdia');
        const minf = new isom_1.Container('minf');
        const dinf = new isom_1.Container('dinf');
        const dref = new isom_1.Container('dref');
        const stbl = new isom_1.Container('stbl');
        dref.set('entry_count', 1);
        trak.append(new isom_1.Box('tkhd', settings.tkhd), mdia.append(new isom_1.Box('mdhd', settings.mdhd), new isom_1.Box('hdlr', settings.hdlr), minf.append(settings.mediaHeaderBox, // vmhd or smhd box (video or sound)
        dinf.append(dref.append(new isom_1.Box('url '))), stbl.append(new isom_1.Container('stsd', undefined, settings.sampleEntryBox), new isom_1.Box('stts'), new isom_1.Box('stsc'), new isom_1.Box('stco'), new isom_1.Box('stsz'), new isom_1.Box('stss')))));
        return trak;
    }
    /**
     * Creates a Moov box from the provided options.
     * @method moov
     * @param  {Object} mvhdSettings settings for the movie header box
     * @param  {Object[]} tracks track specific settings
     * @return {Moov} Moov object
     */
    moov(sdp, date) {
        const moov = new isom_1.Container('moov');
        moov.append(new isom_1.Box('mvhd', {
            creation_time: date,
            modification_time: date,
            duration: 0,
        }));
        const mvex = new isom_1.Container('mvex');
        // For each of the media segments in the SDP structure, we will set up
        // a track in the MP4 file. For each track, a 'trak' box is added to the
        // 'moov' box and a 'trex' box is added to the 'mvex' box.
        this.trackIdMap = {};
        this.sequenceNumber = 0;
        this.ntpPresentationTime = 0;
        let trackId = 0;
        this.trackData = [];
        sdp.media.forEach(media => {
            if (media.rtpmap === undefined) {
                return;
            }
            const payloadType = media.rtpmap.payloadType;
            const encoding = media.rtpmap.encodingName;
            if (formatDefaults[encoding] !== undefined) {
                // We know how to handle this encoding, add a new track for it, and
                // register the track for this payloadType.
                this.trackIdMap[payloadType] = ++trackId;
                // Mark the video track
                if (media.type.toLowerCase() === 'video') {
                    this.videoTrackId = trackId;
                }
                // Extract the settings from the SDP media information based on
                // the encoding name (H264, MPEG4-GENERIC, ...).
                const settings = formatDefaults[encoding](media, date, trackId);
                media.mime = settings.mime; // add MIME type to the SDP media
                media.codec = settings.codec; // add human readable codec string to the SDP media
                const trackData = createTrackData();
                trackData.clockrate = media.rtpmap.clockrate;
                // Set default frame duration (in ticks) for later use
                trackData.defaultFrameDuration = settings.defaultFrameDuration;
                this.trackData.push(trackData);
                const trak = this.trak(settings);
                moov.append(trak);
                mvex.append(new isom_1.Box('trex', { track_ID: trackId }));
            }
        });
        moov.append(mvex);
        return moov;
    }
    /**
     * Boxes that carry actual elementary stream fragment metadata + data.
     */
    /**
     * Creates a moof box from the provided fragment metadata.
     * @method moof
     * @param  {Object} options options containing, sequencenumber, base time, trun settings, samples
     * @return {Moof} Moof object
     */
    moof(metadata) {
        const { trackId, timestamp, byteLength } = metadata;
        const trackOffset = trackId - 1;
        const trackData = this.trackData[trackOffset];
        // The RTP timestamps are unsigned 32 bit and will overflow
        // at some point. We can guard against the overflow by ORing with 0,
        // which will bring any difference back into signed 32-bit domain.
        const duration = trackData.lastTimestamp !== 0
            ? (timestamp - trackData.lastTimestamp) | 0
            : trackData.defaultFrameDuration;
        trackData.lastTimestamp = timestamp;
        const moof = new isom_1.Container('moof');
        const traf = new isom_1.Container('traf');
        const trun = new isom_1.Box('trun', {
            sample_duration: duration,
            sample_size: byteLength,
            first_sample_flags: 0x40,
        });
        moof.append(new isom_1.Box('mfhd', { sequence_number: this.sequenceNumber++ }), traf.append(new isom_1.Box('tfhd', { track_ID: trackId }), new isom_1.Box('tfdt', { baseMediaDecodeTime: trackData.baseMediaDecodeTime }), trun));
        trackData.baseMediaDecodeTime += duration;
        // Correct the trun data offset
        trun.set('data_offset', moof.byteLength + 8);
        updateRateInfo(trackData, { byteLength, duration });
        return moof;
    }
    /**
     * Creates an mdat box containing the elementary stream data.
     * @param  {[type]} data [description]
     * @return [type]        [description]
     */
    mdat(data) {
        const box = new isom_1.Box('mdat');
        box.add('data', data);
        return box;
    }
    setPresentationTime(trackId, ntpTimestamp) {
        // Before updating the baseMediaDecodeTime, we check if
        // there is already a base NTP time to use as a reference
        // for computing presentation times.
        if (!this.ntpPresentationTime &&
            ntpTimestamp &&
            trackId === this.videoTrackId) {
            const trackOffset = trackId - 1;
            const trackData = this.trackData[trackOffset];
            this.ntpPresentationTime =
                ntpTimestamp -
                    1000 * (trackData.baseMediaDecodeTime / trackData.clockrate);
        }
    }
}
exports.BoxBuilder = BoxBuilder;
//# sourceMappingURL=boxbuilder.js.map