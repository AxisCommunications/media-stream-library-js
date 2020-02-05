import { BufferReader } from './bufferreader';
/**
 * Defines functions for writing to a binary buffer.
 * @class BufferWriter
 * @constructor
 * @param {Number} size The size of the buffer.
 */
var SPSParser = /** @class */ (function () {
    function SPSParser(buffer) {
        this.reader = new BufferReader(buffer);
    }
    SPSParser.prototype.parse = function () {
        // nalhdr
        this.reader.readNext();
        var profile = this.reader.readNext();
        // constraints
        this.reader.readNext();
        var level = this.reader.readNext();
        // seqParameterSetId
        this.reader.readUnsignedExpGolomb();
        if ([100, 110, 122, 244, 44, 83, 86, 118].indexOf(profile) >= 0) {
            var chromaFormat = this.reader.readUnsignedExpGolomb();
            if (chromaFormat === 3) {
                // Separate color plane flag
                this.reader.readBits(1);
            }
            // bitDepthLumaMinus8
            this.reader.readUnsignedExpGolomb();
            // bitDepthChromaMinus8
            this.reader.readUnsignedExpGolomb();
            // qpPrimeYZeroTransformBypassFlag
            this.reader.readBits(1);
            var seqScalingMatrix = this.reader.readBits(1);
            if (seqScalingMatrix) {
                for (var k = 0; k < (chromaFormat !== 3 ? 8 : 12); k++) {
                    // seqScalingListPresentFlag
                    this.reader.readBits(1);
                    // TODO: More logic goes here..
                }
            }
        }
        // log2MaxFrameNumMinus4
        this.reader.readUnsignedExpGolomb();
        var picOrderCntType = this.reader.readUnsignedExpGolomb();
        if (picOrderCntType === 0) {
            // log2MaxPicOrderCntLsbMinus4
            this.reader.readUnsignedExpGolomb();
        }
        else if (picOrderCntType === 1) {
            var numRefFramesInPic = 0;
            this.reader.readBits(1);
            this.reader.readSignedExpGolomb();
            this.reader.readSignedExpGolomb();
            numRefFramesInPic = this.reader.readUnsignedExpGolomb();
            for (var i = 0; i < numRefFramesInPic; i++) {
                this.reader.readSignedExpGolomb();
            }
        }
        // maxNumRefFrames
        this.reader.readUnsignedExpGolomb();
        // gapsInFrameNumValueAllowedFlag
        this.reader.readBits(1);
        var picWidthInMbsMinus1 = this.reader.readUnsignedExpGolomb();
        var picHeightInMapUnitsMinus1 = this.reader.readUnsignedExpGolomb();
        var picFrameMbsOnlyFlag = this.reader.readBits(1);
        // direct8x8InferenceFlag
        this.reader.readBits(1);
        var frameCroppingFlag = this.reader.readBits(1);
        var frameCropLeftOffset = frameCroppingFlag
            ? this.reader.readUnsignedExpGolomb()
            : 0;
        var frameCropRightOffset = frameCroppingFlag
            ? this.reader.readUnsignedExpGolomb()
            : 0;
        var frameCropTopOffset = frameCroppingFlag
            ? this.reader.readUnsignedExpGolomb()
            : 0;
        var frameCropBottomOffset = frameCroppingFlag
            ? this.reader.readUnsignedExpGolomb()
            : 0;
        var w = (picWidthInMbsMinus1 + 1) * 16 -
            frameCropLeftOffset * 2 -
            frameCropRightOffset * 2;
        var h = (2 - picFrameMbsOnlyFlag) * (picHeightInMapUnitsMinus1 + 1) * 16 -
            frameCropTopOffset * 2 -
            frameCropBottomOffset * 2;
        return {
            profile: profile,
            level: level / 10.0,
            width: w,
            height: h,
        };
    };
    return SPSParser;
}());
export { SPSParser };
//# sourceMappingURL=spsparser.js.map