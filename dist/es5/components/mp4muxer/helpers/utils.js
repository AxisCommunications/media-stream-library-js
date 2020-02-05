export function b64ToUint6(nChr) {
    return nChr > 64 && nChr < 91
        ? nChr - 65
        : nChr > 96 && nChr < 123
            ? nChr - 71
            : nChr > 47 && nChr < 58
                ? nChr + 4
                : nChr === 43
                    ? 62
                    : nChr === 47
                        ? 63
                        : 0;
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
export function base64DecToArr(sBase64, nBlocksSize) {
    var sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, '');
    var nInLen = sB64Enc.length;
    var nOutLen = nBlocksSize
        ? Math.ceil(((nInLen * 3 + 1) >> 2) / nBlocksSize) * nBlocksSize
        : (nInLen * 3 + 1) >> 2;
    var taBytes = new Uint8Array(nOutLen);
    var nMod3;
    var nMod4;
    var nUint24 = 0;
    var nOutIdx = 0;
    for (var nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (18 - 6 * nMod4);
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
            for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                taBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;
            }
            nUint24 = 0;
        }
    }
    return taBytes;
}
//# sourceMappingURL=utils.js.map