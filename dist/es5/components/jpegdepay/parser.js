var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
import { makeImageHeader, makeHuffmanHeader, makeScanHeader, makeQuantHeader, makeFrameHeader, } from './headers';
import { payload } from '../../utils/protocols/rtp';
import { makeQtable } from './make-qtable';
/**
 * Each packet contains a special JPEG header which immediately follows
 * the RTP header.  The first 8 bytes of this header, called the "main
 * JPEG header", are as follows:*
 *  0                   1                   2                   3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * | Type-specific |              Fragment Offset                  |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |      Type     |       Q       |     Width     |     Height    |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */
/**
 * Restart Marker header: when using types 64-127
 *  0                   1                   2                   3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |       Restart Interval        |F|L|       Restart Count       |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */
/**
 * Quantization Table header: when using Q values 128-255
 *  0                   1                   2                   3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |      MBZ      |   Precision   |             Length            |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |                    Quantization Table Data                    |
 * |                              ...                              |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */
export function jpegDepayFactory(defaultWidth, defaultHeight) {
    if (defaultWidth === void 0) { defaultWidth = 0; }
    if (defaultHeight === void 0) { defaultHeight = 0; }
    var IMAGE_HEADER = makeImageHeader();
    var HUFFMAN_HEADER = makeHuffmanHeader();
    var SCAN_HEADER = makeScanHeader();
    return function jpegDepay(packets) {
        var e_1, _a;
        var metadata;
        var fragments = [];
        try {
            for (var packets_1 = __values(packets), packets_1_1 = packets_1.next(); !packets_1_1.done; packets_1_1 = packets_1.next()) {
                var packet = packets_1_1.value;
                var fragment = payload(packet);
                // Parse and extract JPEG header.
                var typeSpecific = fragment.readUInt8(0);
                var fragmentOffset = (fragment.readUInt8(1) << 16) |
                    (fragment.readUInt8(2) << 8) |
                    fragment.readUInt8(3);
                var type_1 = fragment.readUInt8(4);
                var Q = fragment.readUInt8(5);
                var width_1 = fragment.readUInt8(6) * 8 || defaultWidth;
                var height_1 = fragment.readUInt8(7) * 8 || defaultHeight;
                fragment = fragment.slice(8);
                // Parse and extract Restart Marker header if present.
                var DRI = 0;
                if (type_1 >= 64 && type_1 <= 127) {
                    DRI = fragment.readUInt16BE(0);
                    fragment = fragment.slice(4);
                }
                // Parse and extract Quantization Table header if present.
                if (Q >= 128 && fragmentOffset === 0) {
                    // const MBZ = fragment.readUInt8()
                    var precision_1 = fragment.readUInt8(1);
                    var length_1 = fragment.readUInt16BE(2);
                    var qTable_1 = fragment.slice(4, 4 + length_1);
                    metadata = {
                        typeSpecific: typeSpecific,
                        type: type_1,
                        width: width_1,
                        height: height_1,
                        DRI: DRI,
                        precision: precision_1,
                        qTable: qTable_1,
                    };
                    fragment = fragment.slice(4 + length_1);
                }
                // Compute Quantization Table
                else if (Q < 128 && fragmentOffset === 0) {
                    var precision_2 = 0;
                    var qTable_2 = makeQtable(Q);
                    metadata = {
                        typeSpecific: typeSpecific,
                        type: type_1,
                        width: width_1,
                        height: height_1,
                        DRI: DRI,
                        precision: precision_2,
                        qTable: qTable_2,
                    };
                }
                fragments.push(fragment);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (packets_1_1 && !packets_1_1.done && (_a = packets_1.return)) _a.call(packets_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (metadata === undefined) {
            throw new Error('no quantization header present');
        }
        var precision = metadata.precision, qTable = metadata.qTable, type = metadata.type, width = metadata.width, height = metadata.height;
        var quantHeader = makeQuantHeader(precision, qTable);
        if (metadata.DRI !== 0) {
            throw new Error('not implemented: DRI');
        }
        var frameHeader = makeFrameHeader(width, height, type);
        return {
            size: { width: width, height: height },
            data: Buffer.concat(__spread([
                IMAGE_HEADER,
                quantHeader,
                frameHeader,
                HUFFMAN_HEADER,
                SCAN_HEADER
            ], fragments)),
        };
    };
}
//# sourceMappingURL=parser.js.map