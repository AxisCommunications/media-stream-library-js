import type { AACMedia } from '../types/sdp'
import { fromHex } from '../utils/bytes'

import { Box, Container } from './isom'

export const aacSettings = (media: AACMedia, date: number, trackId: number) => {
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

  const bitrate = Number(media.fmtp.parameters.bitrate) || 320000

  const audioConfigBytes = fromHex(media.fmtp.parameters.config)
  const config = audioSpecificConfig(audioConfigBytes)

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
      name: 'SoundHandler\0', // 00 soundhandler, add 00 if things screws up
    },

    mediaHeaderBox: new Box('smhd'),
    sampleEntryBox: new Container(
      'mp4a',
      {
        samplerate: (media.rtpmap.clockrate << 16) >>> 0, // FIXME: Is this  correct?
      },
      new Box('esds', {
        DecoderConfigDescrLength: 15 + audioConfigBytes.length,
        DecSpecificInfoShortLength: audioConfigBytes.length,
        audioConfigBytes,
        maxBitRate: bitrate,
        avgBitRate: bitrate,
      })
    ),

    id: trackId,
    payloadType: media.rtpmap.payloadType,
    clockrate: media.rtpmap.clockrate,
    /*
    https://wiki.multimedia.cx/index.php/Understanding_AAC
    AAC is a variable bitrate (VBR) block-based codec where each block decodes
    to 1024 time-domain samples, which means that a single block (or frame?) is
    1024 ticks long, which we take as default here.
    */
    defaultFrameDuration: 1024,

    // CODEC info used for MIME type
    codec: `mp4a.40.${config.audioObjectType}`,
    name: aacEncodingName(config),
  }
}

interface AudioSpecificConfig {
  audioObjectType: number
  frequencyIndex?: number
  channelConfig?: number
}

function audioSpecificConfig(bytes: Uint8Array): AudioSpecificConfig {
  // The "config" parameter is a hexadecimal representation of the AudioSpecificConfig()
  // as defined in ISO/IEC 14496-3. Padding bits are added to achieve octet alignment.
  // To keep it simple, we only try to extract what we need, which is the audio object
  // type itself. The sampling frequency and channel configuration are only provided
  // in the simple cases that are supported.
  // AudioSpecificConfig()                              No. of bits
  // {
  //   audioObjectType;                                 5
  //   if (audioObjectType == 31) {
  //     audioObjectType = 32 + audioObjectTypeExt;     6
  //   }
  //   samplingFrequencyIndex;                          4
  //   if ( samplingFrequencyIndex == 0xf ) {
  //     samplingFrequency;                             24
  //   }
  //   channelConfiguration;                            4
  // ... (we don't need the rest)
  // }

  let audioObjectType = bytes[0] >>> 3
  if (audioObjectType === 31) {
    const audioObjectTypeExt = (bytes[0] & 0x07) * 8 + (bytes[1] >>> 5)
    audioObjectType = 32 + audioObjectTypeExt
    return { audioObjectType }
  }

  const frequencyIndex = (bytes[0] & 0x07) * 2 + (bytes[1] >>> 7)
  if (frequencyIndex === 0x0f) {
    return { audioObjectType, frequencyIndex }
  }

  const channelConfig = (bytes[1] >>> 3) & 0x0f

  return {
    audioObjectType,
    frequencyIndex,
    channelConfig,
  }
}

// All audio object types defined in ISO/IEC 14496-3 pp. 40
const AUDIO_OBJECT_TYPE_NAMES: { [key: number]: string } = {
  1: 'AAC Main',
  2: 'AAC LC',
}

// All frequencies defined in ISO/IEC 14496-3 pp. 42
const FREQUENCY_VALUES: { [key: number]: string } = {
  0x0: '96 kHz',
  0x1: '88.2 kHz',
  0x2: '64 kHz',
  0x3: '48 kHz',
  0x4: '44.1 kHz',
  0x5: '32 kHz',
  0x6: '24 kHz',
  0x7: '22.05 kHz',
  0x8: '16 kHz',
  0x9: '12 kHz',
  0xa: '11.025 kHz',
  0xb: '8 kHz',
  0xc: '7.35 kHz',
  0xd: 'unknown',
  0xe: 'unknown',
  0xf: 'custom',
}

// All channels defined in ISO/IEC 14496-3 pp. 42
const CHANNEL_CONFIG_NAMES: { [key: number]: string } = {
  1: 'Mono',
  2: 'Stereo',
}

function aacEncodingName({
  audioObjectType,
  frequencyIndex,
  channelConfig,
}: AudioSpecificConfig): string {
  const audioType =
    AUDIO_OBJECT_TYPE_NAMES[audioObjectType] || `AAC (${audioObjectType})`

  if (frequencyIndex === undefined) {
    return `${audioType}`
  }

  const samplingRate = FREQUENCY_VALUES[frequencyIndex]

  if (channelConfig === undefined) {
    return `${audioType}, ${samplingRate}`
  }

  const channels =
    CHANNEL_CONFIG_NAMES[channelConfig] || channelConfig.toString()

  return `${audioType}, ${samplingRate}, ${channels}`
}
