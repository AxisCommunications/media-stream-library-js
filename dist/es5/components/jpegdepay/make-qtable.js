import { clamp } from '../../utils/clamp';
/**
 * @function makeQtable
 * Creating a quantization table from a Q factor
 * Example Code from RFC 2435 Appendix A ported to TypeScript
 *
 * Default luminance/chrominance quantization tables in RFC example are not in zig-zag order.
 * The RFC does not mention that default tables should be in zig-zag ordering,
 * but they say that about the included tables. RFC sample code appears to have a mistake.
 * All the tested cameras and LGPL projects use zig-zag default tables.
 * So we use zig-zaged tables from ISO/IEC 10918-1 Annex K Section K.1
 * @see https://tools.ietf.org/html/rfc2435
 * @see https://www.iso.org/standard/18902.html
 */
// prettier-ignore
var jpegLumaQuantizer = [
    16, 11, 12, 14, 12, 10, 16, 14,
    13, 14, 18, 17, 16, 19, 24, 40,
    26, 24, 22, 22, 24, 49, 35, 37,
    29, 40, 58, 51, 61, 60, 57, 51,
    56, 55, 64, 72, 92, 78, 64, 68,
    87, 69, 55, 56, 80, 109, 81, 87,
    95, 98, 103, 104, 103, 62, 77, 113,
    121, 112, 100, 120, 92, 101, 103, 99,
];
// prettier-ignore
var jpeChromaQuantizer = [
    17, 18, 18, 24, 21, 24, 47, 26,
    26, 47, 99, 66, 56, 66, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99
];
export function makeQtable(Q) {
    var factor = clamp(Q, 1, 99);
    var buffer = Buffer.alloc(128);
    var S = Q < 50 ? Math.floor(5000 / factor) : 200 - factor * 2;
    for (var i = 0; i < 64; i++) {
        var lq = Math.floor((jpegLumaQuantizer[i] * S + 50) / 100);
        var cq = Math.floor((jpeChromaQuantizer[i] * S + 50) / 100);
        buffer.writeUInt8(clamp(lq, 1, 255), i);
        buffer.writeUInt8(clamp(cq, 1, 255), i + 64);
    }
    return buffer;
}
//# sourceMappingURL=make-qtable.js.map