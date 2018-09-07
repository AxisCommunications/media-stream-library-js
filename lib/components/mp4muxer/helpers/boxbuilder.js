const { Box, Container } = require('./isom')
const aacSettings = require('./aacSettings')
const h264Settings = require('./h264Settings')

const formatDefaults = {
  'MPEG4-GENERIC': aacSettings,
  'H264': h264Settings
}

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
    cumulativeFrames: 0
  }
}

const updateRateInfo = (trackData, { byteLength, duration }) => {
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

/**
 * Create boxes for a stream initiated by an sdp object
 *
 * @class BoxBuilder
 */
class BoxBuilder {
  trak (settings) {
    const trak = new Container('trak')
    const mdia = new Container('mdia')
    const minf = new Container('minf')
    const dinf = new Container('dinf')
    const dref = new Container('dref')
    const stbl = new Container('stbl')

    dref.set('entry_count', 1)

    trak.add(
      new Box('tkhd', settings.tkhd),
      mdia.add(
        new Box('mdhd', settings.mdhd),
        new Box('hdlr', settings.hdlr),
        minf.add(
          settings.mediaHeaderBox, // vmhd or smhd box (video or sound)
          dinf.add(
            dref.add(
              new Box('url ')
            )
          ),
          stbl.add(
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

  /**
   * Creates a Moov box from the provided options.
   * @method moov
   * @param  {Object} mvhdSettings settings for the movie header box
   * @param  {Object[]} tracks track specific settings
   * @return {Moov} Moov object
   */
  moov (sdp, date) {
    const moov = new Container('moov')
    moov.add(
      new Box('mvhd', {
        'creation_time': date,
        'modification_time': date,
        'duration': 0
      })
    )

    const mvex = new Container('mvex')

    // For each of the media segments in the SDP structure, we will set up
    // a track in the MP4 file. For each track, a 'trak' box is added to the
    // 'moov' box and a 'trex' box is added to the 'mvex' box.

    this.trackIdMap = {}
    this.sequenceNumber = 0
    this.ntpPresentationTime = 0

    let trackId = 0
    this.trackData = []

    sdp.media.forEach((media) => {
      const payloadType = media.rtpmap.payloadType
      const encoding = media.rtpmap.encodingName

      if (formatDefaults[encoding]) {
        // We know how to handle this encoding, add a new track for it, and
        // register the track for this payloadType.
        this.trackIdMap[payloadType] = ++trackId

        // Mark the video track
        if (media.type.toLowerCase() === 'video') {
          this.videoTrackId = trackId
        }

        // Extract the settings from the SDP media information based on
        // the encoding name (H264, MPEG4-GENERIC, ...).
        const settings = formatDefaults[encoding](media, date, trackId)
        media.mime = settings.mime // add MIME type to the SDP media
        media.codec = settings.codec // add human readable codec string to the SDP media

        const trackData = createTrackData()
        trackData.clockrate = media.rtpmap.clockrate
        // Set default frame duration (in ticks) for later use
        trackData.defaultFrameDuration = settings.defaultFrameDuration

        this.trackData.push(trackData)

        const trak = this.trak(settings)
        moov.add(trak)
        mvex.add(
          new Box('trex', { 'track_ID': trackId })
        )
      }
    })

    moov.add(mvex)

    return moov
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
  moof (metadata) {
    const { trackId, timestamp, byteLength } = metadata
    const trackOffset = trackId - 1

    const trackData = this.trackData[trackOffset]

    // The RTP timestamps are unsigned 32 bit and will overflow
    // at some point. We can guard against the overflow by ORing with 0,
    // which will bring any difference back into signed 32-bit domain.
    const duration = trackData.lastTimestamp !== 0
      ? (timestamp - trackData.lastTimestamp) | 0
      : trackData.defaultFrameDuration

    trackData.lastTimestamp = timestamp

    const moof = new Container('moof')
    const traf = new Container('traf')

    const trun = new Box('trun', {
      'sample_duration': duration,
      'sample_size': byteLength,
      'first_sample_flags': 0x40
    })

    moof.add(
      new Box('mfhd', { 'sequence_number': this.sequenceNumber++ }),
      traf.add(
        new Box('tfhd', { 'track_ID': trackId }),
        new Box('tfdt', { 'baseMediaDecodeTime': trackData.baseMediaDecodeTime }),
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
   * @param  {[type]} data [description]
   * @return [type]        [description]
   */
  mdat (data) {
    const box = new Box('mdat')
    box.add('data', data)
    return box
  }

  setPresentationTime (trackId, ntpTimestamp) {
    // Before updating the baseMediaDecodeTime, we check if
    // there is already a base NTP time to use as a reference
    // for computing presentation times.
    if (!this.ntpPresentationTime && ntpTimestamp && trackId === this.videoTrackId) {
      const trackOffset = trackId - 1
      const trackData = this.trackData[trackOffset]
      this.ntpPresentationTime = ntpTimestamp - 1000 * (trackData.baseMediaDecodeTime / trackData.clockrate)
    }
  }
};

module.exports = BoxBuilder
