// NTP is offset from 01.01.1900
var NTP_UNIX_EPOCH_OFFSET = Date.UTC(1900, 0, 1);
/**
 * Convert NTP time to milliseconds since January 1, 1970, 00:00:00 UTC (Unix Epoch)
 * @param {Number} ntpMost Seconds since 01.01.1900
 * @param {Number} ntpLeast Fractions since 01.01.1900
 */
export function getTime(ntpMost, ntpLeast) {
    var ntpMilliSeconds = (ntpMost + ntpLeast / 0x100000000) * 1000;
    return NTP_UNIX_EPOCH_OFFSET + ntpMilliSeconds;
}
//# sourceMappingURL=ntp.js.map