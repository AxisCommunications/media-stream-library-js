export declare type seconds = number;
export declare type milliSeconds = number;
export declare type NtpSeconds = number;
export declare type NtpMilliSeconds = number;
/**
 * Convert NTP time to milliseconds since January 1, 1970, 00:00:00 UTC (Unix Epoch)
 * @param {Number} ntpMost Seconds since 01.01.1900
 * @param {Number} ntpLeast Fractions since 01.01.1900
 */
export declare function getTime(ntpMost: number, ntpLeast: number): NtpMilliSeconds;
