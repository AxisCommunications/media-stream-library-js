import { BufferReader } from './bufferreader'

/**
 * Defines functions for writing to a binary buffer.
 * @class BufferWriter
 * @constructor
 * @param {Number} size The size of the buffer.
 */
export class SPSParser {
  public reader: BufferReader

  constructor(buffer: Buffer) {
    this.reader = new BufferReader(buffer)
  }

  parse() {
    // nalhdr
    this.reader.readNext()
    let profile = this.reader.readNext()
    // constraints
    this.reader.readNext()
    let level = this.reader.readNext()

    // seqParameterSetId
    this.reader.readUnsignedExpGolomb()

    if ([100, 110, 122, 244, 44, 83, 86, 118].indexOf(profile) >= 0) {
      let chromaFormat = this.reader.readUnsignedExpGolomb()
      if (chromaFormat === 3) {
        // Separate color plane flag
        this.reader.readBits(1)
      }

      // bitDepthLumaMinus8
      this.reader.readUnsignedExpGolomb()

      // bitDepthChromaMinus8
      this.reader.readUnsignedExpGolomb()

      // qpPrimeYZeroTransformBypassFlag
      this.reader.readBits(1)
      let seqScalingMatrix = this.reader.readBits(1)
      if (seqScalingMatrix) {
        for (let k = 0; k < (chromaFormat !== 3 ? 8 : 12); k++) {
          // seqScalingListPresentFlag
          this.reader.readBits(1)
          // TODO: More logic goes here..
        }
      }
    }

    // log2MaxFrameNumMinus4
    this.reader.readUnsignedExpGolomb()
    let picOrderCntType = this.reader.readUnsignedExpGolomb()
    if (picOrderCntType === 0) {
      // log2MaxPicOrderCntLsbMinus4
      this.reader.readUnsignedExpGolomb()
    } else if (picOrderCntType === 1) {
      let numRefFramesInPic = 0
      this.reader.readBits(1)
      this.reader.readSignedExpGolomb()
      this.reader.readSignedExpGolomb()
      numRefFramesInPic = this.reader.readUnsignedExpGolomb()
      for (let i = 0; i < numRefFramesInPic; i++) {
        this.reader.readSignedExpGolomb()
      }
    }

    // maxNumRefFrames
    this.reader.readUnsignedExpGolomb()
    // gapsInFrameNumValueAllowedFlag
    this.reader.readBits(1)
    let picWidthInMbsMinus1 = this.reader.readUnsignedExpGolomb()
    let picHeightInMapUnitsMinus1 = this.reader.readUnsignedExpGolomb()
    let picFrameMbsOnlyFlag = this.reader.readBits(1)
    // direct8x8InferenceFlag
    this.reader.readBits(1)
    let frameCroppingFlag = this.reader.readBits(1)

    let frameCropLeftOffset = frameCroppingFlag
      ? this.reader.readUnsignedExpGolomb()
      : 0
    let frameCropRightOffset = frameCroppingFlag
      ? this.reader.readUnsignedExpGolomb()
      : 0
    let frameCropTopOffset = frameCroppingFlag
      ? this.reader.readUnsignedExpGolomb()
      : 0
    let frameCropBottomOffset = frameCroppingFlag
      ? this.reader.readUnsignedExpGolomb()
      : 0

    let w =
      (picWidthInMbsMinus1 + 1) * 16 -
      frameCropLeftOffset * 2 -
      frameCropRightOffset * 2
    let h =
      (2 - picFrameMbsOnlyFlag) * (picHeightInMapUnitsMinus1 + 1) * 16 -
      frameCropTopOffset * 2 -
      frameCropBottomOffset * 2

    return {
      profile: profile,
      level: level / 10.0,
      width: w,
      height: h,
    }
  }
}
