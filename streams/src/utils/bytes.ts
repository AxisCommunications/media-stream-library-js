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
