import { toByteArray } from 'base64-js'

import type { H264Media } from '../types/sdp'

import { Box, Container } from './isom'
import { SPSParser } from './spsparser'

const PROFILE_NAMES: { [key: number]: string } = {
  66: 'Baseline Profile',
  77: 'Main Profile',
  100: 'High Profile',
}

const h264EncodingName = (profileLevelId: string): string => {
  const profileCode = parseInt(profileLevelId.slice(0, 2), 16)
  const levelCode = parseInt(profileLevelId.slice(4, 6), 16)

  const profile = PROFILE_NAMES[profileCode] || profileCode.toString()
  const level = (levelCode / 10).toFixed(1)

  return `H.264, ${profile}, level ${level}`
}

export const h264Settings = (
  media: H264Media,
  date: number,
  trackId: number
) => {
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

  const profileLevelId = media.fmtp.parameters['profile-level-id']
  const parameterSets: Uint8Array[] = media.fmtp.parameters[
    'sprop-parameter-sets'
  ]
    .split(',')
    .map(toByteArray)

  // We assume the first set is _the_ SPS (no support for multiple).
  const sps = parameterSets.slice(0, 1)
  // The remaining sets are all PPS to support more than one.
  const pps = parameterSets.slice(1)

  const parsedSps = new SPSParser(sps[0]).parse()
  // If media framerate is missing in SDP, it is not possible to calculate
  // the frame duration. Use a fallback value (90000 Hz / 25 fps)
  const FALLBACK_FRAME_DURATION = 3600
  return {
    mediaHeaderBox: new Box('vmhd'),
    sampleEntryBox: new Container(
      'avc1',
      {
        width: parsedSps.width,
        height: parsedSps.height,
      },
      new Box('avcC', {
        AVCProfileIndication: sps[0][1],
        profile_compatibility: sps[0][2],
        AVCLevelIndication: sps[0][3],
        sequenceParameterSets: sps,
        pictureParameterSets: pps,
      })
    ),
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

    id: trackId,
    payloadType: media.rtpmap.payloadType,
    clockrate: media.rtpmap.clockrate,
    // (ticks / s) / (frames / s) = ticks / frame, e.g. frame duration in ticks
    defaultFrameDuration:
      media.framerate !== undefined && media.framerate > 0
        ? Number(media.rtpmap.clockrate) / Number(media.framerate) ||
          FALLBACK_FRAME_DURATION
        : FALLBACK_FRAME_DURATION,

    // CODEC info used for MIME type
    codec: `avc1.${profileLevelId}`,
    name: h264EncodingName(profileLevelId),
  }
}
