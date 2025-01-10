import { MediaDescription, isAACMedia, isH264Media } from '../types/sdp'

import { aacSettings } from './aacSettings'
import { h264Settings } from './h264Settings'
import { Box, ByteArray, Container } from './isom'

interface MoofMetadata {
  trackData: TrackData
  timestamp: number
  byteLength: number
}

export interface TrackData {
  baseMediaDecodeTime: number
  bitrate: number
  clockrate: number
  codec: string
  cumulativeByteLength: number
  cumulativeDuration: number
  cumulativeFrames: number
  defaultFrameDuration: number
  framerate: number
  id: number
  lastTimestamp: number
  payloadType: number
  name: string
}

const createTrackData = ({
  id,
  clockrate,
  codec,
  defaultFrameDuration,
  name,
  payloadType,
}: {
  clockrate: number
  codec: string
  defaultFrameDuration: number
  id: number
  name: string
  payloadType: number
}): TrackData => {
  return {
    baseMediaDecodeTime: 0,
    bitrate: 0,
    clockrate,
    codec,
    cumulativeByteLength: 0,
    cumulativeDuration: 0,
    cumulativeFrames: 0,
    defaultFrameDuration,
    framerate: 0,
    id,
    lastTimestamp: 0,
    name,
    payloadType,
  }
}

interface RateInfo {
  byteLength: number
  duration: number
}

const updateRateInfo = (
  trackData: TrackData,
  { byteLength, duration }: RateInfo
) => {
  trackData.cumulativeByteLength += byteLength
  trackData.cumulativeDuration += duration
  trackData.cumulativeFrames++

  // Update the cumulative number size (bytes) and duration (ticks), and if
  // the duration exceeds the clockrate (meaning longer than 1 second of data),
  // then compute a new bitrate and reset cumulative size and duration.
  if (trackData.cumulativeDuration >= trackData.clockrate) {
    const bits = 8 * trackData.cumulativeByteLength
    const frames = trackData.cumulativeFrames
    const seconds = trackData.cumulativeDuration / trackData.clockrate
    trackData.bitrate = bits / seconds
    trackData.framerate = frames / seconds
    trackData.cumulativeByteLength = 0
    trackData.cumulativeDuration = 0
    trackData.cumulativeFrames = 0
  }
}

type TrackSettings = ReturnType<typeof mediaSettings>[number]
export function mediaSettings(
  mediaDescriptions: MediaDescription[],
  date: number
) {
  let trackId = 0
  return mediaDescriptions
    .map((media) => {
      if (isH264Media(media)) {
        return h264Settings(media, date, ++trackId)
      }
      if (isAACMedia(media)) {
        return aacSettings(media, date, ++trackId)
      }
    })
    .filter((media) => media !== undefined)
}

/**
 * Create boxes for a stream initiated by an sdp object
 *
 * @class BoxBuilder
 */
export class BoxBuilder {
  public sequenceNumber: number
  /** The (approximate) real time corresponding to the start of the video media,
   * extrapolated from the first available NTP timestamp and decode time. */
  public videoStartTime: number
  /** Data for each track indexed by it's payload type (number) */
  public trackData: Record<number, TrackData | undefined>

  constructor() {
    this.sequenceNumber = 0
    this.videoStartTime = 0
    this.trackData = {}
  }

  trak(settings: TrackSettings) {
    const trak = new Container('trak')
    const mdia = new Container('mdia')
    const minf = new Container('minf')
    const dinf = new Container('dinf')
    const dref = new Container('dref')
    const stbl = new Container('stbl')

    dref.set('entry_count', 1)

    trak.append(
      new Box('tkhd', settings.tkhd),
      mdia.append(
        new Box('mdhd', settings.mdhd),
        new Box('hdlr', settings.hdlr),
        minf.append(
          settings.mediaHeaderBox, // vmhd or smhd box (video or sound)
          dinf.append(dref.append(new Box('url '))),
          stbl.append(
            new Container('stsd', undefined, settings.sampleEntryBox),
            new Box('stts'),
            new Box('stsc'),
            new Box('stco'),
            new Box('stsz'),
            new Box('stss')
          )
        )
      )
    )

    return trak
  }

  // Creates a Moov box from the provided options.
  moov(tracks: ReturnType<typeof mediaSettings>, date: any) {
    const moov = new Container('moov')
    moov.append(
      new Box('mvhd', {
        creation_time: date,
        modification_time: date,
        duration: 0,
      })
    )

    const mvex = new Container('mvex')

    // For each of the media segments in the SDP structure, we will set up
    // a track in the MP4 file. For each track, a 'trak' box is added to the
    // 'moov' box and a 'trex' box is added to the 'mvex' box.

    this.sequenceNumber = 0
    this.videoStartTime = 0

    this.trackData = {}

    tracks.forEach((track) => {
      this.trackData[track.payloadType] = createTrackData(track)
      const trak = this.trak(track)
      moov.append(trak)
      mvex.append(new Box('trex', { track_ID: track.id }))
    })

    moov.append(mvex)

    return moov
  }

  /**
   * Boxes that carry actual elementary stream fragment metadata + data.
   */

  /**
   * Creates a moof box from the provided fragment metadata.
   * @method moof
   * @param  metadata - Track ID, timestamp, bytelength
   * @return moof Container
   */
  moof(metadata: MoofMetadata) {
    const { trackData, timestamp, byteLength } = metadata

    // The RTP timestamps are unsigned 32 bit and will overflow
    // at some point. We can guard against the overflow by ORing with 0,
    // which will bring any difference back into signed 32-bit domain.
    // If the duration would be negative, it's set to zero to prevent
    // possible issues later when it's written as an unsigned int.
    const duration =
      trackData.lastTimestamp !== 0
        ? Math.max(0, (timestamp - trackData.lastTimestamp) | 0)
        : trackData.defaultFrameDuration

    trackData.lastTimestamp = timestamp

    const moof = new Container('moof')
    const traf = new Container('traf')

    const trun = new Box('trun', {
      sample_duration: duration,
      sample_size: byteLength,
      first_sample_flags: 0x40,
    })

    moof.append(
      new Box('mfhd', { sequence_number: this.sequenceNumber++ }),
      traf.append(
        new Box('tfhd', { track_ID: trackData.id }),
        new Box('tfdt', { baseMediaDecodeTime: trackData.baseMediaDecodeTime }),
        trun
      )
    )

    trackData.baseMediaDecodeTime += duration

    // Correct the trun data offset
    trun.set('data_offset', moof.byteLength + 8)

    updateRateInfo(trackData, { byteLength, duration })

    return moof
  }

  /**
   * Creates an mdat box containing the elementary stream data.
   * @param  data - Elementary stream data
   * @return mdat Box
   */
  mdat(data: Uint8Array) {
    const box = new Box('mdat')
    box.add('data', new ByteArray(data))
    return box
  }

  setVideoStartTime(track: TrackData, ntpTimestamp?: number) {
    // Before updating the baseMediaDecodeTime, we check if
    // there is already a base NTP time to use as a reference
    // for computing presentation times.
    if (!this.videoStartTime && ntpTimestamp) {
      const { baseMediaDecodeTime, clockrate } = track
      this.videoStartTime =
        ntpTimestamp - 1000 * (baseMediaDecodeTime / clockrate)
    }
  }
}
