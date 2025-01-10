/* biome-ignore format: custom formatting */
export const rtpBuffers = [
  new Uint8Array([128, 96, 80, 56, 225, 39, 20, 132, 25, 190, 186, 105]),
  new Uint8Array([128, 224, 80, 76, 225, 39, 108, 97, 25, 190, 186, 105, 1, 2, 3]),
  new Uint8Array([
    129, 224, 80, 95, 225, 40, 57, 104, 25, 190, 186, 105, 0, 0, 0, 1, 1, 2, 3,
  ]),
]

/* biome-ignore format: custom formatting */
export const rtpBuffersWithHeaderExt = [
  new Uint8Array([
    144, 224, 80, 76, 225, 39, 108, 97, 25, 190, 186, 105, 1, 2, 0, 0, 1, 2, 3,
  ]),
  new Uint8Array([
    144, 224, 80, 76, 225, 39, 108, 97, 25, 190, 186, 105, 1, 2, 0, 1, 1, 2, 3,
    4, 1, 2, 3,
  ]),
]
