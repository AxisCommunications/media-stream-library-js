/* biome-ignore format: custom formatting */
export const rtcpSRBuffers = [
  // 0 reports
  new Uint8Array([
    128, 200, 0, 6, 243, 203, 32, 1, 131, 171, 3, 161, 235, 2, 11, 58, 0, 0,
    148, 32, 0, 0, 0, 158, 0, 0, 155, 136,
  ]),

  // 3 reports
  new Uint8Array([
    131, 200, 0, 24, 243, 203, 32, 1, 131, 171, 3, 161, 235, 2, 11, 58, 0, 0,
    148, 32, 0, 0, 0, 158, 0, 0, 155, 136, 0, 0, 0, 1, 4, 0, 0, 10, 0, 0, 0,
    1000, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 2, 4, 0, 0, 11, 0, 0, 0,
    1001, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 3, 4, 0, 0, 12, 0, 0, 0,
    1002, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 13,
  ]),
]

/* biome-ignore format: custom formatting */
export const rtcpRRBuffers = [
  // 0 reports
  new Uint8Array([128, 201, 0, 1, 27, 117, 249, 76]),

  // 3 reports
  new Uint8Array([
    131, 201, 0, 19, 27, 117, 249, 76, 0, 0, 0, 1, 4, 0, 0, 10, 0, 0, 0, 1000,
    0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 2, 4, 0, 0, 11, 0, 0, 0, 1001,
    0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 3, 4, 0, 0, 12, 0, 0, 0, 1002,
    0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 13,
  ]),
]

/* biome-ignore format: custom formatting */
export const rtcpSDESBuffers = [
  new Uint8Array([
    129, 202, 0, 12, 217, 157, 189, 215, 1, 28, 117, 115, 101, 114, 50, 53, 48,
    51, 49, 52, 53, 55, 54, 54, 64, 104, 111, 115, 116, 45, 50, 57, 50, 48, 53,
    57, 53, 50, 6, 9, 71, 83, 116, 114, 101, 97, 109, 101, 114, 0, 0, 0,
  ]),

  // 2 chunks (1+2 priv)
  new Uint8Array([
  130, 202, 0, 12, 0, 0, 0, 1, 1, 6, 67, 78, 65, 77, 69, 49, 8, 5, 2, 67, 49, 86, 49, 0, // 5 words
    0, 0, 0, 2, 1, 6, 67, 78, 65, 77, 69, 50, 8, 5, 2, 67, 50, 86, 50, 8, 5, 2, 67, 51, 86, 51, 0, 0, // 7 words
  ]),
]

/* biome-ignore format: custom formatting */
export const rtcpBYEBuffers = [
  new Uint8Array([129, 203, 0, 1, 38, 197, 204, 95]),

  // 0 byes (valid, but useless)
  new Uint8Array([128, 203, 0, 0]),

  // 3 byes + reason (valid, but useless)
  new Uint8Array([
    131, 203, 0, 5, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 4, 76, 111, 115, 116, 0,
    0, 0,
  ]),
]

/* biome-ignore format: custom formatting */
export const rtcpAPPBuffers = [
  new Uint8Array([
    133, 204, 0, 4, 0, 0, 0, 42, 76, 105, 102, 101, 0, 1, 2, 3, 42, 42, 42, 42,
  ]),
]
