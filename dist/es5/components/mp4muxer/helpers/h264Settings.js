import { base64DecToArr } from './utils';
import { Box, Container } from './isom';
import { SPSParser } from './spsparser';
var PROFILE_NAMES = {
    66: 'Baseline',
    77: 'Main',
    100: 'High',
};
var h264EncodingName = function (profileLevelId) {
    var profileCode = parseInt(profileLevelId.substr(0, 2), 16);
    var levelCode = parseInt(profileLevelId.substr(4, 2), 16);
    var profile = PROFILE_NAMES[profileCode] || profileCode.toString();
    var level = (levelCode / 10).toFixed(1);
    return {
        coding: 'H.264',
        profile: profile,
        level: level,
    };
};
export var h264Settings = function (media, date, trackId) {
    /*
     * Example SDP media segment for H264 audio:
     *
  
     {
       "type": "video",
       "port": "0",
       "proto": "RTP/AVP",
       "fmt": "96",
       "connectionData": {
         "netType": "IN",
         "addrType": "IP4",
         "connectionAddress": "0.0.0.0"
       },
       "bwtype": "AS",
       "bandwidth": "50000",
       "rtpmap": {
         "payloadType": "96",
         "encodingName": "H264",
         "clockrate": "90000"
       },
       "fmtp": {
         "format": "96",
         "parameters": {
           "packetization-mode": "1",
           "profile-level-id": "4d0029",
           "sprop-parameter-sets": "Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA=="
         }
       },
       "control": "rtsp://hostname/axis-media/media.amp/stream=0?audio=1",
       "framerate": "25.000000",
       "transform": [[1,0,0],[0,1,0],[0,0,1]]
     },
  
     */
    var profileLevelId = media.fmtp.parameters['profile-level-id'];
    var parameterSets = media.fmtp.parameters['sprop-parameter-sets']
        .split(',')
        .map(base64DecToArr);
    // We assume the first set is _the_ SPS (no support for multiple).
    var sps = parameterSets.slice(0, 1);
    // The remaining sets are all PPS to support more than one.
    var pps = parameterSets.slice(1);
    var parsedSps = new SPSParser(sps[0].buffer).parse();
    // If media framerate is missing in SDP, it is not possible to calculate
    // the frame duration. Use a fallback value (90000 Hz / 25 fps)
    var FALLBACK_FRAME_DURATION = 3600;
    return {
        mediaHeaderBox: new Box('vmhd'),
        sampleEntryBox: new Container('avc1', {
            width: parsedSps.width,
            height: parsedSps.height,
        }, new Box('avcC', {
            AVCProfileIndication: sps[0][1],
            profile_compatibility: sps[0][2],
            AVCLevelIndication: sps[0][3],
            sequenceParameterSets: sps,
            pictureParameterSets: pps,
        })),
        tkhd: {
            track_ID: trackId,
            creation_time: date,
            modification_time: date,
            width: parsedSps.width << 16,
            height: parsedSps.height << 16,
            volume: 0,
        },
        hdlr: {},
        mdhd: {
            timescale: media.rtpmap.clockrate,
            creation_time: date,
            modification_time: date,
            duration: 0,
        },
        // (ticks / s) / (frames / s) = ticks / frame, e.g. frame duration in ticks
        defaultFrameDuration: media.framerate !== undefined && media.framerate > 0
            ? Number(media.rtpmap.clockrate) / Number(media.framerate) ||
                FALLBACK_FRAME_DURATION
            : FALLBACK_FRAME_DURATION,
        // MIME type
        mime: "avc1." + profileLevelId,
        codec: h264EncodingName(profileLevelId),
    };
};
//# sourceMappingURL=h264Settings.js.map