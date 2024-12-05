// Concatenate bytes
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

// Decode UTF-8 bytes
const DECODER = new TextDecoder()
export function decode(bytes: Uint8Array): string {
  // don't use streams: true option since we use a global decoder
  return DECODER.decode(bytes)
}

// Encode string to UTF-8 bytes
const ENCODER = new TextEncoder()
export function encode(text: string): Uint8Array {
  // don't use streams: true option since we use a global encoder
  return ENCODER.encode(text)
}

// Extract 8-bit big-endian value at byte offset
export function readUInt8(bytes: Uint8Array, byteOffset: number): number {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).getUint8(byteOffset)
}

// Extract 16-bit big-endian value at byte offset
export function readUInt16BE(bytes: Uint8Array, byteOffset: number): number {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).getUint16(byteOffset)
}

// Extract 24-bit big-endian value at byte offset
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

// Extract 32-bit big-endian value at byte offset
export function readUInt32BE(bytes: Uint8Array, byteOffset: number): number {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).getUint32(byteOffset)
}
