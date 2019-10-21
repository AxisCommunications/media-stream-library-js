// NTP is offset from 01.01.1900
const NTP_UNIX_EPOCH_OFFSET = Date.UTC(1900, 0, 1)

// Convenience types
export type seconds = number
export type milliSeconds = number
export type NtpSeconds = number
export type NtpMilliSeconds = number

/**
 * Convert NTP time to milliseconds since January 1, 1970, 00:00:00 UTC (Unix Epoch)
 * @param {Number} ntpMost Seconds since 01.01.1900
 * @param {Number} ntpLeast Fractions since 01.01.1900
 */
export function getTime(ntpMost: number, ntpLeast: number): NtpMilliSeconds {
  const ntpMilliSeconds = (ntpMost + ntpLeast / 0x100000000) * 1000
  return NTP_UNIX_EPOCH_OFFSET + ntpMilliSeconds
}
