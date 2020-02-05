import { Container, Box } from './isom';
import { aacSettings } from './aacSettings';
import { h264Settings } from './h264Settings';
var formatDefaults = {
    'MPEG4-GENERIC': aacSettings,
    H264: h264Settings,
};
var createTrackData = function () {
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
var updateRateInfo = function (trackData, _a) {
    var byteLength = _a.byteLength, duration = _a.duration;
    trackData.cumulativeByteLength += byteLength;
    trackData.cumulativeDuration += duration;
    trackData.cumulativeFrames++;
    // Update the cumulative number size (bytes) and duration (ticks), and if
    // the duration exceeds the clockrate (meaning longer than 1 second of data),
    // then compute a new bitrate and reset cumulative size and duration.
    if (trackData.cumulativeDuration >= trackData.clockrate) {
        var bits = 8 * trackData.cumulativeByteLength;
        var frames_1 = trackData.cumulativeFrames;
        var seconds = trackData.cumulativeDuration / trackData.clockrate;
        trackData.bitrate = bits / seconds;
        trackData.framerate = frames_1 / seconds;
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
var BoxBuilder = /** @class */ (function () {
    function BoxBuilder() {
        this.trackIdMap = {};
        this.sequenceNumber = 0;
        this.ntpPresentationTime = 0;
        this.trackData = [];
    }
    BoxBuilder.prototype.trak = function (settings) {
        var trak = new Container('trak');
        var mdia = new Container('mdia');
        var minf = new Container('minf');
        var dinf = new Container('dinf');
        var dref = new Container('dref');
        var stbl = new Container('stbl');
        dref.set('entry_count', 1);
        trak.append(new Box('tkhd', settings.tkhd), mdia.append(new Box('mdhd', settings.mdhd), new Box('hdlr', settings.hdlr), minf.append(settings.mediaHeaderBox, // vmhd or smhd box (video or sound)
        dinf.append(dref.append(new Box('url '))), stbl.append(new Container('stsd', undefined, settings.sampleEntryBox), new Box('stts'), new Box('stsc'), new Box('stco'), new Box('stsz'), new Box('stss')))));
        return trak;
    };
    /**
     * Creates a Moov box from the provided options.
     * @method moov
     * @param  {Object} mvhdSettings settings for the movie header box
     * @param  {Object[]} tracks track specific settings
     * @return {Moov} Moov object
     */
    BoxBuilder.prototype.moov = function (sdp, date) {
        var _this = this;
        var moov = new Container('moov');
        moov.append(new Box('mvhd', {
            creation_time: date,
            modification_time: date,
            duration: 0,
        }));
        var mvex = new Container('mvex');
        // For each of the media segments in the SDP structure, we will set up
        // a track in the MP4 file. For each track, a 'trak' box is added to the
        // 'moov' box and a 'trex' box is added to the 'mvex' box.
        this.trackIdMap = {};
        this.sequenceNumber = 0;
        this.ntpPresentationTime = 0;
        var trackId = 0;
        this.trackData = [];
        sdp.media.forEach(function (media) {
            if (media.rtpmap === undefined) {
                return;
            }
            var payloadType = media.rtpmap.payloadType;
            var encoding = media.rtpmap.encodingName;
            if (formatDefaults[encoding] !== undefined) {
                // We know how to handle this encoding, add a new track for it, and
                // register the track for this payloadType.
                _this.trackIdMap[payloadType] = ++trackId;
                // Mark the video track
                if (media.type.toLowerCase() === 'video') {
                    _this.videoTrackId = trackId;
                }
                // Extract the settings from the SDP media information based on
                // the encoding name (H264, MPEG4-GENERIC, ...).
                var settings = formatDefaults[encoding](media, date, trackId);
                media.mime = settings.mime; // add MIME type to the SDP media
                media.codec = settings.codec; // add human readable codec string to the SDP media
                var trackData = createTrackData();
                trackData.clockrate = media.rtpmap.clockrate;
                // Set default frame duration (in ticks) for later use
                trackData.defaultFrameDuration = settings.defaultFrameDuration;
                _this.trackData.push(trackData);
                var trak = _this.trak(settings);
                moov.append(trak);
                mvex.append(new Box('trex', { track_ID: trackId }));
            }
        });
        moov.append(mvex);
        return moov;
    };
    /**
     * Boxes that carry actual elementary stream fragment metadata + data.
     */
    /**
     * Creates a moof box from the provided fragment metadata.
     * @method moof
     * @param  {Object} options options containing, sequencenumber, base time, trun settings, samples
     * @return {Moof} Moof object
     */
    BoxBuilder.prototype.moof = function (metadata) {
        var trackId = metadata.trackId, timestamp = metadata.timestamp, byteLength = metadata.byteLength;
        var trackOffset = trackId - 1;
        var trackData = this.trackData[trackOffset];
        // The RTP timestamps are unsigned 32 bit and will overflow
        // at some point. We can guard against the overflow by ORing with 0,
        // which will bring any difference back into signed 32-bit domain.
        var duration = trackData.lastTimestamp !== 0
            ? (timestamp - trackData.lastTimestamp) | 0
            : trackData.defaultFrameDuration;
        trackData.lastTimestamp = timestamp;
        var moof = new Container('moof');
        var traf = new Container('traf');
        var trun = new Box('trun', {
            sample_duration: duration,
            sample_size: byteLength,
            first_sample_flags: 0x40,
        });
        moof.append(new Box('mfhd', { sequence_number: this.sequenceNumber++ }), traf.append(new Box('tfhd', { track_ID: trackId }), new Box('tfdt', { baseMediaDecodeTime: trackData.baseMediaDecodeTime }), trun));
        trackData.baseMediaDecodeTime += duration;
        // Correct the trun data offset
        trun.set('data_offset', moof.byteLength + 8);
        updateRateInfo(trackData, { byteLength: byteLength, duration: duration });
        return moof;
    };
    /**
     * Creates an mdat box containing the elementary stream data.
     * @param  {[type]} data [description]
     * @return [type]        [description]
     */
    BoxBuilder.prototype.mdat = function (data) {
        var box = new Box('mdat');
        box.add('data', data);
        return box;
    };
    BoxBuilder.prototype.setPresentationTime = function (trackId, ntpTimestamp) {
        // Before updating the baseMediaDecodeTime, we check if
        // there is already a base NTP time to use as a reference
        // for computing presentation times.
        if (!this.ntpPresentationTime &&
            ntpTimestamp &&
            trackId === this.videoTrackId) {
            var trackOffset = trackId - 1;
            var trackData = this.trackData[trackOffset];
            this.ntpPresentationTime =
                ntpTimestamp -
                    1000 * (trackData.baseMediaDecodeTime / trackData.clockrate);
        }
    };
    return BoxBuilder;
}());
export { BoxBuilder };
//# sourceMappingURL=boxbuilder.js.map