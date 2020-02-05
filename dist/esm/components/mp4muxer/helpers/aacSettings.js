import { Box, Container } from './isom';
// All audio object types defined in ISO/IEC 14496-3 pp. 40
const AUDIO_OBJECT_TYPE_NAMES = {
    1: 'AAC Main',
    2: 'AAC LC',
};
// All frequencies defined in ISO/IEC 14496-3 pp. 42
const FREQUENCY_VALUES = {
    0: '96 kHz',
    1: '88.2 kHz',
    2: '64 kHz',
    3: '48 kHz',
    4: '44.1 kHz',
    5: '32 kHz',
    6: '24 kHz',
    7: '22.05 kHz',
    8: '16 kHz',
    9: '12 kHz',
    10: '11.025 kHz',
    11: '8 kHz',
    12: '7.35 kHz',
};
// All channels defined in ISO/IEC 14496-3 pp. 42
const CHANNEL_CONFIG_NAMES = {
    1: 'Mono',
    2: 'Stereo',
};
const aacEncodingName = (audioConfigBytes) => {
    const audioObjectType = (audioConfigBytes >>> 11) & 0x001f;
    const frequencyIndex = (audioConfigBytes >>> 7) & 0x000f;
    const channelConfig = (audioConfigBytes >>> 3) & 0x000f;
    const audioType = AUDIO_OBJECT_TYPE_NAMES[audioObjectType] || `AAC (${audioObjectType})`;
    const samplingRate = FREQUENCY_VALUES[frequencyIndex] || 'unknown';
    const channels = CHANNEL_CONFIG_NAMES[channelConfig] || channelConfig.toString();
    return {
        coding: audioType,
        samplingRate,
        channels,
    };
};
export const aacSettings = (media, date, trackId) => {
    /*
     * Example SDP media segment for MPEG4-GENERIC audio:
     *
  
    {
       "type": "audio",
       "port": "0",
       "proto": "RTP/AVP",
       "fmt": "97",
       "connectionData": {
         "netType": "IN",
         "addrType": "IP4",
         "connectionAddress": "0.0.0.0"
       },
       "bwtype": "AS",
       "bandwidth": "32",
       "rtpmap": {
         "payloadType": "97",
         "encodingName": "MPEG4-GENERIC",
         "clockrate": "16000",
         "encodingParameters": "1"
       },
       "fmtp": {
         "format": "97",
         "parameters": {
           "streamtype": "5",
           "profile-level-id": "2",
           "mode": "AAC-hbr",
           "config": "1408",
           "sizelength": "13",
           "indexlength": "3",
           "indexdeltalength": "3",
           "bitrate": "32000"
         }
       },
       "control": "rtsp://hostname/axis-media/media.amp/stream=1?audio=1"
     }
  
     */
    const bitrate = Number(media.fmtp.parameters.bitrate) || 320000;
    const audioConfigBytes = parseInt(media.fmtp.parameters.config, 16);
    const audioObjectType = (audioConfigBytes >>> 11) & 0x001f;
    return {
        tkhd: {
            track_ID: trackId,
            creation_time: date,
            modification_time: date,
            width: 0,
            height: 0,
            volume: 1,
        },
        mdhd: {
            timescale: Number(media.rtpmap.clockrate),
            creation_time: date,
            modification_time: date,
            duration: 0,
        },
        hdlr: {
            handler_type: 'soun',
            name: 'SoundHandler\0',
        },
        mediaHeaderBox: new Box('smhd'),
        sampleEntryBox: new Container('mp4a', {
            samplerate: (media.rtpmap.clockrate << 16) >>> 0,
        }, new Box('esds', {
            audioConfigBytes: audioConfigBytes,
            maxBitRate: bitrate,
            avgBitRate: bitrate,
        })),
        /*
        https://wiki.multimedia.cx/index.php/Understanding_AAC
        AAC is a variable bitrate (VBR) block-based codec where each block decodes
        to 1024 time-domain samples, which means that a single block (or frame?) is
        1024 ticks long, which we take as default here.
        */
        defaultFrameDuration: 1024,
        // MIME type
        mime: `mp4a.40.${audioObjectType}`,
        codec: aacEncodingName(audioConfigBytes),
    };
};
//# sourceMappingURL=aacSettings.js.map