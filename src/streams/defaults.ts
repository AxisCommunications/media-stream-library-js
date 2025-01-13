/** Generates an Axis RTSP URI for a hostname (no default parameters) */
export function axisRtspMediaUri(
  hostname: string = typeof window === 'undefined'
    ? ''
    : window.location.hostname,
  parameters: string[] = []
) {
  return parameters.length > 0
    ? `rtsp://${hostname}/axis-media/media.amp?${parameters.join('&')}`
    : `rtsp://${hostname}/axis-media/media.amp`
}

/** Generates an Axis RTSP URI for a hostname with parameters such
 * that only events are streamed (no video or audio), suitable for
 * pure metadata streaming */
export function axisRtspMetadataUri(
  hostname: string = typeof window === 'undefined'
    ? ''
    : window.location.hostname
) {
  return axisRtspMediaUri(hostname, [
    'audio=0',
    'video=0',
    'event=on',
    'ptz=all',
  ])
}

/** Generates an Axis rtsp-over-websocket configuration with a
 * WebSocket URI and a token URI (for authentication) */
export function axisWebSocketConfig(href = window.location.href) {
  const url = new URL(href)
  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const uri = new URL(`${wsProtocol}//${url.host}/rtsp-over-websocket`).href
  const tokenUri = new URL('/axis-cgi/rtspwssession.cgi', url).href
  return { uri, tokenUri, protocol: 'binary' }
}
