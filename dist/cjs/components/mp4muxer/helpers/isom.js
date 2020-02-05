"use strict";
// Elements: parts of a box that hold values.
// They should have a:
// - byteLength
// - value (can be accessed from outside to set/retrieve)
// - store(buffer, offset) -> write the value to a buffer
// - load(buffer, offset) -> read data and store in value
Object.defineProperty(exports, "__esModule", { value: true });
// Constants
const UINT32_RANGE = Math.pow(2, 32);
class BoxElement {
    constructor(size) {
        this.byteLength = size;
    }
}
class Empty extends BoxElement {
    constructor(size = 0) {
        super(size);
        this.copy = (buffer, offset) => {
            buffer.fill(0, offset, offset + this.byteLength);
        };
    }
    load() {
        /** noop */
    }
}
class CharArray extends BoxElement {
    constructor(s) {
        super(s.length);
        this.copy = (buffer, offset) => {
            for (let i = 0; i < this.byteLength; i += 1) {
                buffer[offset + i] = this.value.charCodeAt(i);
            }
        };
        this.load = (buffer, offset) => {
            this.value = buffer
                .slice(offset, offset + this.byteLength)
                .toString('ascii');
        };
        this.value = s;
    }
}
class UInt8 extends BoxElement {
    constructor(scalar = 0) {
        super(1);
        this.copy = (buffer, offset) => {
            buffer.writeUInt8(this.value, offset);
        };
        this.load = (buffer, offset) => {
            this.value = buffer.readUInt8(offset);
        };
        this.value = scalar;
    }
}
class UInt8Array extends BoxElement {
    constructor(array) {
        super(array.length);
        this.copy = (buffer, offset) => {
            for (let i = 0; i < this.value.length; ++i) {
                buffer.writeUInt8(this.value[i], offset + i);
            }
        };
        this.load = (buffer, offset) => {
            for (let i = 0; i < this.value.length; ++i) {
                this.value[i] = buffer.readUInt8(offset + i);
            }
        };
        this.value = array;
    }
}
class UInt16BE extends BoxElement {
    constructor(scalar = 0) {
        super(2);
        this.copy = (buffer, offset) => {
            buffer.writeUInt16BE(this.value, offset);
        };
        this.load = (buffer, offset) => {
            this.value = buffer.readUInt16BE(offset);
        };
        this.value = scalar;
    }
}
class UInt24BE extends BoxElement {
    constructor(scalar = 0) {
        super(3);
        this.copy = (buffer, offset) => {
            buffer.writeUInt8((this.value >> 16) & 0xff, offset);
            buffer.writeUInt8((this.value >> 8) & 0xff, offset + 1);
            buffer.writeUInt8(this.value & 0xff, offset + 2);
        };
        this.load = (buffer, offset) => {
            this.value =
                (buffer.readUInt8(offset) << (16 + buffer.readUInt8(offset + 1))) <<
                    (8 + buffer.readUInt8(offset + 2));
        };
        this.value = scalar;
    }
}
class UInt16BEArray extends BoxElement {
    constructor(array) {
        super(array.length * 2);
        this.copy = (buffer, offset) => {
            for (let i = 0; i < this.value.length; ++i) {
                buffer.writeUInt16BE(this.value[i], offset + 2 * i);
            }
        };
        this.load = (buffer, offset) => {
            for (let i = 0; i < this.value.length; ++i) {
                this.value[i] = buffer.readUInt16BE(offset + 2 * i);
            }
        };
        this.value = array;
    }
}
class UInt32BE extends BoxElement {
    constructor(scalar = 0) {
        super(4);
        this.copy = (buffer, offset) => {
            buffer.writeUInt32BE(this.value, offset);
        };
        this.load = (buffer, offset) => {
            this.value = buffer.readUInt32BE(offset);
        };
        this.value = scalar;
    }
}
class UInt32BEArray extends BoxElement {
    constructor(array) {
        super(array.length * 4);
        this.copy = (buffer, offset) => {
            for (let i = 0; i < this.value.length; ++i) {
                buffer.writeUInt32BE(this.value[i], offset + 4 * i);
            }
        };
        this.load = (buffer, offset) => {
            for (let i = 0; i < this.value.length; ++i) {
                this.value[i] = buffer.readUInt32BE(offset + 4 * i);
            }
        };
        this.value = array;
    }
}
class UInt64BE extends BoxElement {
    constructor(scalar = 0) {
        super(8);
        this.copy = (buffer, offset) => {
            const high = (this.value / UINT32_RANGE) | 0;
            const low = this.value - high * UINT32_RANGE;
            buffer.writeUInt32BE(high, offset);
            buffer.writeUInt32BE(low, offset + 4);
        };
        this.load = (buffer, offset) => {
            const high = buffer.readUInt32BE(offset);
            const low = buffer.readUInt32BE(offset + 4);
            this.value = high * UINT32_RANGE + low;
        };
        this.value = scalar;
    }
}
/**
 * Class factory for a parameter set element. A parameter set groups a size,
 * and an array of parameter sets consisting each of a size and a byte array.
 * These elements are used by the avcC box.
 * @param  {Number} [sizeMask=0x00]  A bit mask to use for the size.
 * @return {Class}  An element type that groups parameter sets.
 */
const createParameterSetArrayClass = function (sizeMask = 0x00) {
    return class ParameterSetArray extends BoxElement {
        /**
         * Takes an array of byte-arrays
         * @param  {array} array The array of byte arrays
         * @return {[type]}       [description]
         */
        constructor(array) {
            super(0);
            this.copy = (buffer, offset) => {
                let i = 0;
                for (const element of this.value) {
                    element.copy(buffer, offset + i);
                    i += element.byteLength;
                }
            };
            this.load = () => {
                /** noop */
            };
            // this.setLengths = array.map((byteArray) => byteArray.length);
            this.value = array.reduce((flatArray, byteArray) => {
                return flatArray.concat(new UInt16BE(byteArray.length), new UInt8Array(byteArray));
            }, [new UInt8(sizeMask | array.length)]);
            this.byteLength = this.value.reduce((total, element) => total + element.byteLength, 0);
        }
    };
};
/**
 * Specifications for a selection of ISO BMFF box types.
 *
 * Most of these are defined in ISO/IEC 14496-12,
 * For specific boxes like avc1/avcC/mp4a/esds the exact document is specified
 * with the appropriate box/descriptor.
 *
 * To add a new box, follow the same pattern: you need an object with at least
 * the property 'box' (which is 'Box' or 'FullBox') and for non-container boxes
 * you need also a 'body' property specifying the elements that the box contains.
 * The values assigned to each element in the spec are used as default.
 */
const BOXSPEC = {
    // File Type Box
    ftyp: {
        container: 'file',
        mandatory: true,
        quantity: 'one',
        box: 'Box',
        body: [
            ['major_brand', CharArray, 'isom'],
            ['minor_version', UInt32BE, 0],
            ['compatible_brands', CharArray, 'mp41'],
        ],
    },
    // Movie Container
    moov: {
        container: 'file',
        mandatory: true,
        quantity: 'one',
        box: 'Box',
    },
    // Movie Data Box
    mdat: {
        container: 'file',
        mandatory: false,
        quantity: 'any',
        box: 'Box',
        body: [],
    },
    // Movie Header Box
    mvhd: {
        container: 'moov',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['creation_time', UInt32BE, 0],
            ['modification_time', UInt32BE, 0],
            ['timescale', UInt32BE, 1000],
            ['duration', UInt32BE, 0xffffffff],
            ['rate', UInt32BE, 0x00010000],
            ['volume', UInt16BE, 0x0100],
            ['reserved', Empty, 10],
            // transformation matrix, default = unity
            [
                'matrix',
                UInt32BEArray,
                [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000],
            ],
            ['pre_defined', Empty, 24],
            ['next_track_ID', UInt32BE, 0xffffffff],
        ],
    },
    // Track Container
    trak: {
        container: 'moov',
        mandatory: true,
        quantity: 'one+',
        box: 'Box',
    },
    // Track Header Box
    tkhd: {
        container: 'trak',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        // Flag values for the track header:
        // 0x000001 Track_enabled: track enabled (otherwise ignored)
        // 0x000002 Track_in_movie: track used in presentation
        // 0x000004 Track_in_preview: used when previewing presentation
        config: {
            flags: 0x000003,
        },
        body: [
            ['creation_time', UInt32BE, 0],
            ['modification_time', UInt32BE, 0],
            ['track_ID', UInt32BE, 1],
            ['reserved', Empty, 4],
            ['duration', UInt32BE, 0],
            ['reserved2', Empty, 8],
            ['layer', UInt16BE, 0],
            ['alternate_group', UInt16BE, 0],
            ['volume', UInt16BE, 0x0100],
            ['reserved3', Empty, 2],
            [
                'matrix',
                UInt32BEArray,
                [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000],
            ],
            ['width', UInt32BE, 0],
            ['height', UInt32BE, 0],
        ],
    },
    // Track Reference Box
    tref: {
        container: 'trak',
        mandatory: false,
        quantity: 'one-',
        box: 'Box',
    },
    // Media Container
    mdia: {
        container: 'trak',
        mandatory: false,
        quantity: 'one',
        box: 'Box',
    },
    // Media Header Box
    mdhd: {
        container: 'mdia',
        mandatory: false,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['creation_time', UInt32BE, 0],
            ['modification_time', UInt32BE, 0],
            ['timescale', UInt32BE, 1000],
            ['duration', UInt32BE, 0xffffffff],
            ['language', UInt16BE, 0],
            ['pre_defined', UInt16BE, 0],
        ],
    },
    // Handler Reference Box
    hdlr: {
        container: 'mdia',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['predefined', UInt32BE, 0],
            ['handler_type', CharArray, 'vide'],
            ['reserved', Empty, 12],
            ['name', CharArray, 'VideoHandler\0'],
        ],
    },
    // Media Information Container
    minf: {
        container: 'mdia',
        mandatory: true,
        quantity: 'one',
        box: 'Box',
    },
    // Video Media Header Box
    vmhd: {
        container: 'minf',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        config: {
            flags: 0x000001,
        },
        body: [
            ['graphicsmode', UInt16BE, 0],
            ['opcolor', UInt16BEArray, [0, 0, 0]],
        ],
    },
    // Sound Media Header Box
    smhd: {
        container: 'minf',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        body: [
            // Place mono track in stereo space:
            //  8.8 fixed point, 0 = center, -1.0 = left, 1.0 = right
            ['balance', UInt16BE, 0x0000],
            ['reserved', UInt16BE],
        ],
    },
    // Data Information Container
    dinf: {
        container: 'minf',
        mandatory: true,
        quantity: 'one',
        box: 'Box',
    },
    // Data Reference Box
    dref: {
        // When adding elements to this box, update the entry_count value!
        container: 'dinf',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['entry_count', UInt32BE, 0],
        ],
    },
    'url ': {
        container: 'dref',
        mandatory: true,
        quantity: 'one+',
        box: 'FullBox',
        // Flag values:
        // 0x000001 Local reference, which means empty URL
        config: {
            flags: 0x000001,
        },
        body: [
        // ['location', CharArray, ''],
        ],
    },
    // Sample Table Container
    stbl: {
        container: 'minf',
        mandatory: true,
        quantity: 'one',
        box: 'Box',
    },
    // Decoding Time to Sample Box
    stts: {
        container: 'stbl',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['entry_count', UInt32BE, 0],
        ],
    },
    stsd: {
        container: 'stbl',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['entry_count', UInt32BE, 1],
        ],
    },
    /*
    ISO/IEC 14496-12:2005(E) 8.16.2 (pp. 28)
    aligned(8) abstract class SampleEntry (unsigned int(32) format)
      extends Box(format){
      const unsigned int(8)[6] reserved = 0;
      unsigned int(16) data_reference_index;
    }
    class VisualSampleEntry(codingname) extends SampleEntry (codingname){
      unsigned int(16) pre_defined = 0;
      const unsigned int(16) reserved = 0;
      unsigned int(32)[3] pre_defined = 0;
      unsigned int(16) width;
      unsigned int(16) height;
      template unsigned int(32) horizresolution = 0x00480000; // 72 dpi
      template unsigned int(32) vertresolution = 0x00480000; // 72 dpi
      const unsigned int(32) reserved = 0;
      template unsigned int(16) frame_count = 1;
      string[32] compressorname;
      template unsigned int(16) depth = 0x0018;
      int(16) pre_defined = -1;
    }
    ISO/IEC 14496-15:2004(E) 5.3.4.1 (pp. 14)
    class AVCSampleEntry() extends VisualSampleEntry (‘avc1’){
      AVCConfigurationBox config;
      MPEG4BitRateBox (); // optional
      MPEG4ExtensionDescriptorsBox (); // optional
    }
    */
    avc1: {
        container: 'stsd',
        mandatory: false,
        quantity: 'one',
        box: 'Box',
        body: [
            ['reserved', Empty, 6],
            ['data_reference_index', UInt16BE, 1],
            ['pre_defined', UInt16BE, 0],
            ['reserved2', Empty, 2],
            ['pre_defined2', UInt32BEArray, [0, 0, 0]],
            ['width', UInt16BE, 1920],
            ['height', UInt16BE, 1080],
            ['horizresolution', UInt32BE, 0x00480000],
            ['vertresolution', UInt32BE, 0x00480000],
            ['reserved3', UInt32BE, 0],
            ['frame_count', UInt16BE, 1],
            ['compressorname', UInt8Array, Buffer.alloc(32)],
            ['depth', UInt16BE, 0x0018],
            ['pre_defined3', UInt16BE, 0xffff],
        ],
    },
    /*
    class AVCConfigurationBox extends Box(‘avcC’) {
      AVCDecoderConfigurationRecord() AVCConfig;
    }
    ISO/IEC 14496-15:2004(E) 5.2.4.1.1 (pp. 12)
    aligned(8) class AVCDecoderConfigurationRecord {
      unsigned int(8) configurationVersion = 1;
      unsigned int(8) AVCProfileIndication;
      unsigned int(8) profile_compatibility;
      unsigned int(8) AVCLevelIndication;
      bit(6) reserved = ‘111111’b;
      unsigned int(2) lengthSizeMinusOne;
      bit(3) reserved = ‘111’b;
      unsigned int(5) numOfSequenceParameterSets;
      for (i=0; i< numOfSequenceParameterSets; i++) {
        unsigned int(16) sequenceParameterSetLength ;
        bit(8*sequenceParameterSetLength) sequenceParameterSetNALUnit;
      }
      unsigned int(8) numOfPictureParameterSets;
      for (i=0; i< numOfPictureParameterSets; i++) {
        unsigned int(16) pictureParameterSetLength;
        bit(8*pictureParameterSetLength) pictureParameterSetNALUnit;
      }
    }
    */
    avcC: {
        container: 'avc1',
        mandatory: false,
        quantity: 'one',
        box: 'Box',
        body: [
            ['configurationVersion', UInt8, 1],
            ['AVCProfileIndication', UInt8, 0x4d],
            ['profile_compatibility', UInt8, 0x00],
            ['AVCLevelIndication', UInt8, 0x29],
            // size = reserved 0b111111 + 0b11 NALUnitLength (0b11 = 4-byte)
            ['lengthSizeMinusOne', UInt8, 0b11111111],
            // Example SPS (length 20):
            //   [0x67, 0x4d, 0x00, 0x29, 0xe2, 0x90, 0x0f, 0x00,
            //    0x44, 0xfc, 0xb8, 0x0b, 0x70, 0x10, 0x10, 0x1a,
            //    0x41, 0xe2, 0x44, 0x54]
            // number of sets = reserved 0b111 + number of SPS (0b00001 = 1)
            // ['numOfSequenceParameterSets', UInt8, 0b11100001],
            // ['sequenceParameterSetLength', UInt16BE, 0], // Lenght in bytes of the SPS that follows
            // ['sequenceParameterSetNALUnit', UInt8Array, []],
            // These are packed in a single custom element:
            ['sequenceParameterSets', createParameterSetArrayClass(0xe0), []],
            // Example PPS (length 4):
            //   [0x68, 0xee, 0x3c, 0x80]
            // ['numOfPictureParameterSets', UInt8, 1], // number of PPS
            // ['pictureParameterSetLength', UInt16BE, 0], // Length in bytes of the PPS that follows
            // ['pictureParameterSetNALUnit', UInt8Array, []]
            // These are packed in a single custom element:
            ['pictureParameterSets', createParameterSetArrayClass(), []],
        ],
    },
    /*
    ISO/IEC 14496-12:2005(E) 8.16.2 (pp. 28)
    aligned(8) abstract class SampleEntry (unsigned int(32) format)
      extends Box(format){
      const unsigned int(8)[6] reserved = 0;
      unsigned int(16) data_reference_index;
    }
    class AudioSampleEntry(codingname) extends SampleEntry (codingname){
      const unsigned int(32)[2] reserved = 0;
      template unsigned int(16) channelcount = 2;
      template unsigned int(16) samplesize = 16;
      unsigned int(16) pre_defined = 0;
      const unsigned int(16) reserved = 0 ;
      template unsigned int(32) samplerate = {timescale of media}<<16;
    }
    */
    mp4a: {
        container: 'stsd',
        mandatory: false,
        quantity: 'one',
        box: 'Box',
        body: [
            ['reserved', Empty, 6],
            ['data_reference_index', UInt16BE, 1],
            ['reserved2', UInt32BEArray, [0, 0]],
            ['channelcount', UInt16BE, 2],
            ['samplesize', UInt16BE, 16],
            ['pre_defined', UInt16BE, 0],
            ['reserved3', UInt16BE, 0],
            ['samplerate', UInt32BE, 0],
        ],
    },
    /* Elementary stream descriptor
    basic box that holds only an ESDescriptor
    reference: 'https://developer.apple.com/library/content/documentation/QuickTime/
  QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-124774'
    Descriptors have a tag that identifies them, specified in ISO/IEC 14496-1 8.3.12
    ISO/IEC 14496-1 8.3.3 (pp. 24) ES_Descriptor
    aligned(8) class ES_Descriptor : bit(8) tag=ES_DescrTag {
      bit(8) length;
      bit(16) ES_ID;
      bit(1) streamDependenceFlag;
      bit(1) URL_Flag;
      const bit(1) reserved=1;
      bit(5) streamPriority;
      if (streamDependenceFlag)
        bit(16) dependsOn_ES_ID;
      if (URL_Flag)
        bit(8) URLstring[length-3-(streamDependencFlag*2)];
      ExtensionDescriptor extDescr[0 .. 255];
      LanguageDescriptor langDescr[0 .. 1];
      DecoderConfigDescriptor decConfigDescr;
      SLConfigDescriptor slConfigDescr;
      IPI_DescPointer ipiPtr[0 .. 1];
      IP_IdentificationDataSet ipIDS[0 .. 1];
      QoS_Descriptor qosDescr[0 .. 1];
    }
    aligned(8) class DecoderConfigDescriptor
      : bit(8) tag=DecoderConfigDescrTag {
      bit(8) length;
      bit(8) objectProfileIndication;
      bit(6) streamType;
      bit(1) upStream;
      const bit(1) reserved=1;
      bit(24) bufferSizeDB;
      bit(32) maxBitrate;
      bit(32) avgBitrate;
      DecoderSpecificInfo decSpecificInfo[];
    }
    aligned(8) class DecoderSpecificInfoShort extends DecoderSpecificInfo
    : bit(8) tag=DecSpecificInfoShortTag
    {
      bit(8) length;
      bit(8) specificInfo[length];
    }
    aligned(8) class SLConfigDescriptor : bit(8) tag=SLConfigDescrTag {
      bit(8) length;
      bit(8) predefined;
      if (predefined==0) {
        bit(1) useAccessUnitStartFlag;
        bit(1) useAccessUnitEndFlag;
        bit(1) useRandomAccessPointFlag;
        bit(1) usePaddingFlag;
        bit(1) useTimeStampsFlag;
        bit(1) useWallClockTimeStampFlag;
        bit(1) useIdleFlag;
        bit(1) durationFlag;
        bit(32) timeStampResolution;
        bit(32) OCRResolution;
        bit(8) timeStampLength; // must be less than 64
        bit(8) OCRLength;
        // must be less than 64
        bit(8) AU_Length;
        // must be less than 32
        bit(8) instantBitrateLength;
        bit(4) degradationPriorityLength;
        bit(4) seqNumLength;
        if (durationFlag) {
          bit(32) timeScale;
          bit(16) accessUnitDuration;
          bit(16) compositionUnitDuration;
        }
        if (!useTimeStampsFlag) {
          if (useWallClockTimeStampFlag)
            double(64) wallClockTimeStamp;
          bit(timeStampLength) startDecodingTimeStamp;
          bit(timeStampLength) startCompositionTimeStamp;
        }
      }
      aligned(8) bit(1) OCRstreamFlag;
      const bit(7) reserved=0b1111.111;
      if (OCRstreamFlag)
        bit(16) OCR_ES_Id;
    }
    */
    esds: {
        container: 'mp4a',
        mandatory: false,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['ES_DescrTag', UInt8, 3],
            // length of the remainder of this descriptor in byte,
            // excluding trailing embedded descriptors.
            ['ES_DescrLength', UInt8, 25],
            ['ES_ID', UInt16BE, 1],
            ['flagsAndStreamPriority', UInt8, 0],
            ['DecoderConfigDescrTag', UInt8, 4],
            // length of the remainder of this descriptor in bytes,
            // excluding trailing embedded descriptors.
            ['DecoderConfigDescrLength', UInt8, 17],
            ['objectProfileIndication', UInt8, 0x40],
            ['streamTypeUpstreamReserved', UInt8, 0x15],
            ['bufferSizeDB', UInt8Array, [0, 0, 0]],
            ['maxBitRate', UInt32BE, 0],
            ['avgBitRate', UInt32BE, 0],
            ['DecSpecificInfoShortTag', UInt8, 5],
            ['DecSpecificInfoShortLength', UInt8, 2],
            ['audioConfigBytes', UInt16BE, 0],
            ['SLConfigDescrTag', UInt8, 6],
            ['SLConfigDescrLength', UInt8, 1],
            ['SLConfigDescrPredefined', UInt8, 0x02],
        ],
    },
    // Sample Size Box
    stsz: {
        container: 'stbl',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['sample_size', UInt32BE, 0],
            ['sample_count', UInt32BE, 0],
        ],
    },
    // Sample To Chunk Box
    stsc: {
        container: 'stbl',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['entry_count', UInt32BE, 0],
        ],
    },
    // Chunk Offset Box
    stco: {
        container: 'stbl',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['entry_count', UInt32BE, 0],
        ],
    },
    // Sync Sample Box
    stss: {
        container: 'stbl',
        mandatory: false,
        quantity: 'one-',
        box: 'FullBox',
        body: [
            ['entry_count', UInt32BE, 0],
        ],
    },
    // Edit Box
    edts: {
        container: 'trak',
        mandatory: false,
        quantity: 'one-',
        box: 'Box',
    },
    // Edit List Box
    elst: {
        container: 'edts',
        mandatory: false,
        quantity: 'one-',
        box: 'FullBox',
        body: [
            ['entry_count', UInt32BE, 1],
            ['segment_duration', UInt32BE, 0],
            ['media_time', UInt32BE, 0xffffffff],
            ['media_rate_integer', UInt16BE, 1],
            ['media_rate_fraction', UInt16BE, 0],
        ],
    },
    mvex: {
        container: 'moov',
        mandatory: false,
        quantity: 'one-',
        box: 'Box',
    },
    mehd: {
        container: 'mvex',
        mandatory: false,
        quantity: 'one-',
        box: 'FullBox',
        body: [
            ['fragment_duration', UInt32BE, 0],
        ],
    },
    trex: {
        container: 'mvex',
        mandatory: true,
        quantity: 'one+',
        box: 'FullBox',
        body: [
            ['track_ID', UInt32BE, 1],
            ['default_sample_description_index', UInt32BE, 1],
            ['default_sample_duration', UInt32BE, 0],
            ['default_sample_size', UInt32BE, 0],
            ['default_sample_flags', UInt32BE, 0],
        ],
    },
    moof: {
        container: 'file',
        mandatory: false,
        quantity: 'zero+',
        box: 'Box',
    },
    mfhd: {
        container: 'moof',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        body: [
            ['sequence_number', UInt32BE, 0],
        ],
    },
    traf: {
        container: 'moof',
        mandatory: false,
        quantity: 'zero+',
        box: 'Box',
    },
    tfhd: {
        container: 'traf',
        mandatory: true,
        quantity: 'one',
        box: 'FullBox',
        // Flag values for the track fragment header:
        // 0x000001 base-data-offset-present
        // 0x000002 sample-description-index-present
        // 0x000008 default-sample-duration-present
        // 0x000010 default-sample-size-present
        // 0x000020 default-sample-flags-present
        // 0x010000 duration-is-empty
        // 0x020000 default-base-is-moof
        config: {
            flags: 0x000020,
        },
        body: [
            ['track_ID', UInt32BE, 1],
            // ['base_data_offset', UInt64BE, 0],
            // ['default_sample_description_index', UInt32BE, 0],
            // ['default_sample_duration', UInt32BE, 0],
            // ['default_sample_size', UInt32BE, 0],
            ['default_sample_flags', UInt32BE, 0],
        ],
    },
    tfdt: {
        container: 'traf',
        mandatory: false,
        quantity: 'one-',
        box: 'FullBox',
        config: {
            version: 1,
        },
        body: [['baseMediaDecodeTime', UInt64BE, 0]],
    },
    trun: {
        container: 'traf',
        mandatory: false,
        quantity: 'zero+',
        box: 'FullBox',
        // Flag values for the track fragment header:
        // 0x000001 data-offset-present
        // 0x000004 first-sample-flags-present
        // 0x000100 sample-duration-present
        // 0x000200 sample-size-present
        // 0x000400 sample-flags-present
        // 0x000800 sample-composition-time-offsets-present
        config: {
            flags: 0x000305,
        },
        body: [
            ['sample_count', UInt32BE, 1],
            ['data_offset', UInt32BE, 0],
            ['first_sample_flags', UInt32BE, 0],
            ['sample_duration', UInt32BE, 0],
            ['sample_size', UInt32BE, 0],
        ],
    },
    // Unknown Box, used for parsing
    '....': {
        box: 'Box',
        body: [],
    },
    // File Box, special box without any headers
    file: {
        box: 'None',
        mandatory: true,
        quantity: 'one',
    },
};
/**
 * Helper functions to generate some standard elements that are needed by
 * all types of boxes.
 * All boxes have a length and type, where so-called full boxes have an
 * additional 4-bytes (1-byte version and 3-byte flags fields).
 */
class Header {
    static None() {
        return [];
    }
    static Box(type) {
        return [
            ['size', UInt32BE, 0],
            ['type', CharArray, type],
        ];
    }
    static FullBox(type) {
        return [].concat(this.Box(type), [
            ['version', UInt8, 0x00],
            ['flags', UInt24BE, 0x000000],
        ]);
    }
}
/**
 * Box class.
 *
 * Defines a box as an entity similar to a C struct, where the struct is
 * represented by a Map of elements.
 * Each element is an object with at least:
 *  - a 'byteLength' property (size of element in bytes)
 *  - a 'copy' method (BufferMutation signature)
 */
class Box extends BoxElement {
    /**
     * Create a new Box.
     * @param  {String} type   4-character ASCII string
     * @param  {Object} config Configuration holding (key: value) fields
     */
    constructor(type, config) {
        super(0);
        this.type = type;
        const spec = BOXSPEC[this.type];
        if (spec === undefined) {
            throw new Error(`unknown box type: ${type}`);
        }
        this.config = Object.assign({}, spec.config, config);
        const header = Header[spec.box](this.type);
        const body = spec.body || [];
        // Uglify changes the name of the original class, so this doesn't work.
        // TODO: find a better way to check for this.
        // if (spec.body === undefined && this.constructor.name !== 'Container') {
        //   throw new Error(`Body missing but '${type}' is not a container box`);
        // }
        // Initialize all elements, an element is something with a byteLength
        this.struct = new Map();
        let offset = 0;
        for (const [key, Type, defaultValue] of [].concat(header, body)) {
            if (this.has(key)) {
                throw new Error('Trying to add existing key');
            }
            let value = defaultValue;
            if (this.config[key]) {
                value = this.config[key];
            }
            const element = new Type(value);
            this.struct.set(key, { offset, element });
            offset += element.byteLength;
        }
        this.byteLength = offset;
    }
    /**
     * Get access to an element based on it's name.
     * @param  {String} key The element's name
     * @return {Element}    Object with 'byteLength' property and 'copy' method
     */
    element(key) {
        const value = this.struct.get(key);
        if (value === undefined) {
            throw new Error('invalid key');
        }
        return value.element;
    }
    /**
     * Set an element's value.
     * @param  {String} key The element's name
     * @param  {Number|Array} value The element's (new) value
     * @return {undefined}
     */
    set(key, value) {
        this.element(key).value = value;
    }
    /**
     * Get an element's value.
     * @param  {String} key The element's name
     * @return {Number|Array}  The element's value
     */
    get(key) {
        return this.element(key).value;
    }
    /**
     * Get an element's offset.
     * @param  {String} key The element's name
     * @return {Number}  The element's offset
     */
    offset(key) {
        const value = this.struct.get(key);
        if (value === undefined) {
            throw new Error('invalid key');
        }
        return value.offset;
    }
    /**
     * Check if a certain element exists
     * @param  {String}  key The element's name
     * @return {Boolean}     true if the element is known, false if not
     */
    has(key) {
        return this.struct.has(key);
    }
    /**
     * Add a new element to the box.
     * @param {String} key     A _new_ non-existing element name.
     * @param {Object} element Something with a 'byteLength' property and 'copy' method.
     * @return {Box} this box, so that 'add' can be used in a chain
     */
    add(key, element) {
        if (this.has(key)) {
            throw new Error('Trying to add existing key');
        }
        this.struct.set(key, { offset: this.byteLength, element });
        this.byteLength += element.byteLength;
        return this;
    }
    /**
     * Create a buffer and copy all element values to it.
     * @return {Buffer} Data representing the box.
     */
    buffer() {
        const buffer = Buffer.allocUnsafe(this.byteLength);
        this.copy(buffer);
        return buffer;
    }
    /**
     * Copy all values of the box into an existing buffer.
     * @param  {Buffer} buffer     The target buffer to accept the box data
     * @param  {Number} [offset=0] The number of bytes into the target to start at.
     * @return {undefined}
     */
    copy(buffer, offset = 0) {
        // Before writing, make sure the size property is set correctly.
        this.set('size', this.byteLength);
        for (const entry of this.struct.values()) {
            entry.element.copy(buffer, offset + entry.offset);
        }
    }
    /**
     * Read element values from a box's data representation.
     * @param  {buffer} buffer     The source buffer with box data
     * @param  {Number} [offset=0] The number of bytes into the source to start at.
     * @return {undefined}
     */
    load(buffer, offset = 0) {
        for (const entry of this.struct.values()) {
            if (entry.element.load !== undefined) {
                entry.element.load(buffer, offset + entry.offset);
            }
        }
    }
    /**
     * Pretty-format an entire box as an element/box hierarchy.
     * @param  {Number} [indent=0] How large an indentation to use for the hierarchy
     * @return {undefined}
     */
    format(indent = 0) {
        const lines = [' '.repeat(indent) + `[${this.type}] (${this.byteLength})`];
        for (const [key, entry] of this.struct) {
            const element = entry.element;
            if (element.format !== undefined) {
                lines.push(element.format(indent + 2));
            }
            else {
                lines.push(' '.repeat(indent + 2) +
                    `${key} = ${element.value} (${element.byteLength})`);
            }
        }
        return lines.join('\n');
    }
    /**
     * Pretty-print an entire box as an element/box hierarchy.
     * @param  {Number} [indent=0] How large an indentation to use for the hierarchy
     * @return {undefined}
     */
    print(indent) {
        console.warn(this.format(indent));
    }
}
exports.Box = Box;
/**
 * Container class
 *
 * special box with an 'add' method which allows appending of other boxes,
 * and a 'parse' method to extract contained boxes.
 */
class Container extends Box {
    /**
     * Create a new container box
     * @param  {String} type   4-character ASCII string
     * @param  {Object} config Configuration holding (key: value) fields
     * @param  {Box} boxes  One or more boxes to append.
     */
    constructor(type, config, ...boxes) {
        super(type, config);
        this.boxSize = 0;
        this.append(...boxes);
    }
    /**
     * Add one or more boxes to the container.
     * @param {Box} boxes The box(es) to append
     * @return {Box} this container, so that add can be used in a chain
     */
    append(...boxes) {
        for (const box of boxes) {
            this.add(`box_${this.boxSize++}`, box);
        }
        return this;
    }
    /**
     * Parse a container box by looking for boxes that it contains, and
     * recursively proceed when it is another container.
     * @param  {Buffer} data The data to parse.
     * @return {undefined}
     */
    parse(data) {
        while (data.byteLength > 0) {
            const type = new CharArray('....');
            type.load(data, 4);
            const spec = BOXSPEC[type.value];
            let box;
            if (spec !== undefined) {
                if (spec.body !== undefined) {
                    box = new Box(type.value);
                    box.load(data);
                }
                else {
                    box = new Container(type.value);
                    box.load(data);
                    box.parse(data.slice(box.byteLength, box.get('size')));
                }
            }
            else {
                box = new Box('....');
                box.load(data);
                box.type = box.get('type');
            }
            this.append(box);
            data = data.slice(box.get('size'));
        }
    }
}
exports.Container = Container;
//# sourceMappingURL=isom.js.map