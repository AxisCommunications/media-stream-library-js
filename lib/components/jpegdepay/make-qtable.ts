import { clamp } from '../../utils/clamp'
/*
 * luma table
 */
// prettier-ignore
const jpegLumaQuantizer = [
  16,  11,  12,  14,  12,  10,  16,  14,
  13,  14,  18,  17,  16,  19,  24,  40,
  26,  24,  22,  22,  24,  49,  35,  37,
  29,  40,  58,  51,  61,  60,  57,  51,
  56,  55,  64,  72,  92,  78,  64,  68,
  87,  69,  55,  56,  80,  109, 81,  87,
  95,  98,  103, 104, 103, 62,  77,  113,
  121, 112, 100, 120, 92,  101, 103, 99,
]
/*
 * chroma table
 */
// prettier-ignore
const jpeChromaQuantizer = [
  17,  18,  18,  24,  21,  24,  47,  26,
  26,  47,  99,  66,  56,  66,  99,  99,
  99,  99,  99,  99,  99,  99,  99,  99,
  99,  99,  99,  99,  99,  99,  99,  99,
  99,  99,  99,  99,  99,  99,  99,  99,
  99,  99,  99,  99,  99,  99,  99,  99,
  99,  99,  99,  99,  99,  99,  99,  99,
  99,  99,  99,  99,  99,  99,  99,  99
]

export function makeQtable(Q: number): Buffer {
  const factor = clamp(Q, 1, 99)
  const buffer = Buffer.alloc(128)
  let S

  if (Q < 50) S = Math.floor(5000 / factor) >>> 0
  else S = (200 - factor * 2) >>> 0

  for (let i = 0; i < 64; i++) {
    const lq = Math.floor((jpegLumaQuantizer[i] * S + 50) / 100)
    const cq = Math.floor((jpeChromaQuantizer[i] * S + 50) / 100)
    buffer.writeUInt8(clamp(lq, 1, 255), i)
    buffer.writeUInt8(clamp(cq, 1, 255), i + 64)
  }
  return buffer
}
