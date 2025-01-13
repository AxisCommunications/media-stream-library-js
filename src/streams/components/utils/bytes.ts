/** Concatenate a list of byte arrays to a single byte array */
export function concat(bufs: Uint8Array[]): Uint8Array {
  let byteLength = 0
  for (const b of bufs) {
    byteLength += b.length
  }
  const buf = new Uint8Array(byteLength)
  let offset = 0
  for (const b of bufs) {
    buf.set(b, offset)
    offset += b.length
  }
  return buf
}

// String conversion

const DECODER = new TextDecoder()
/** Convert a UTF-8 byte array to a string */
export function decode(bytes: Uint8Array): string {
  // don't use streams: true option since we use a global decoder
  return DECODER.decode(bytes)
}

const ENCODER = new TextEncoder()
/** Convert a string to a UTF-8 byte array */
export function encode(text: string): Uint8Array {
  // don't use streams: true option since we use a global encoder
  return ENCODER.encode(text)
}

// Integer read/write

/** Read a value as unsigned 8-bit integer at specified byte offset. */
export function readUInt8(bytes: Uint8Array, byteOffset: number): number {
  return bytes[byteOffset]
}

/** Write a value as unsigned 8-bit integer at specified byte offset. */
export function writeUInt8(
  bytes: Uint8Array,
  byteOffset: number,
  value: number
) {
  bytes[byteOffset] = value
}

/** Read a value as unsigned 16-bit integer at specified byte offset. */
export function readUInt16BE(bytes: Uint8Array, byteOffset: number): number {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).getUint16(byteOffset)
}

/** Write a value as unsigned 16-bit integer at specified byte offset. */
export function writeUInt16BE(
  bytes: Uint8Array,
  byteOffset: number,
  value: number
) {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).setUint16(byteOffset, value)
}

/** Read a value as unsigned 24-bit integer at specified byte offset. */
export function readUInt24BE(bytes: Uint8Array, byteOffset: number): number {
  const dataView = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  )
  return (
    (dataView.getUint8(byteOffset) << 16) +
    (dataView.getUint8(byteOffset + 1) << 8) +
    dataView.getUint8(byteOffset + 2)
  )
}

/** Write a value as unsigned 24-bit integer at specified byte offset. */
export function writeUInt24BE(
  bytes: Uint8Array,
  byteOffset: number,
  value: number
) {
  const dataView = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  )

  dataView.setUint8(byteOffset, (value >> 16) & 0xff)
  dataView.setUint8(byteOffset + 1, (value >> 8) & 0xff)
  dataView.setUint8(byteOffset + 2, value & 0xff)
}

/** Read a value as unsigned 32-bit integer at specified byte offset. */
export function readUInt32BE(bytes: Uint8Array, byteOffset: number): number {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).getUint32(byteOffset)
}

/** Write a value as unsigned 32-bit integer at specified byte offset. */
export function writeUInt32BE(
  bytes: Uint8Array,
  byteOffset: number,
  value: number
) {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).setUint32(byteOffset, value)
}

export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('invalid hex representation of bytes (not a multiple of 2)')
  }
  const bytes = new Uint8Array(hex.length / 2)
  bytes.forEach((_, i) => {
    bytes[i] = parseInt(hex.substring(2 * i, 2 * (i + 1)), 16)
  })
  return bytes
}
