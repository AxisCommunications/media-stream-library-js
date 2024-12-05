export function mimeType(codecs: { codec?: string }[]) {
  // MIME codecs: https://tools.ietf.org/html/rfc6381
  const mimeCodecs = codecs.map((media) => media.codec).filter((codec) => codec)
  const codecParams =
    mimeCodecs.length !== 0 ? mimeCodecs.join(', ') : 'avc1.640029, mp4a.40.2'

  const mimeType = `video/mp4; codecs="${codecParams}"`

  return mimeType
}
