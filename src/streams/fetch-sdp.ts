import { Sdp } from './components/types'

import { WebSocketConfig, openWebSocket } from './openwebsocket'

import { RtspConfig, RtspSession, WSSource } from './components'
import { consumer } from './components/utils/streams'

export interface TransformConfig {
  ws: WebSocketConfig
  rtsp: RtspConfig
}

/**
 * fetchSdp sends a DESCRIBE command to an RTSP server and then
 * immediately tears down the RTSP session, returning the SDP
 * information contained in the RTSP response.
 */
export async function fetchSdp(config: TransformConfig): Promise<Sdp> {
  const { ws: wsConfig, rtsp: rtspConfig } = config

  const rtsp = new RtspSession(rtspConfig)
  const socket = await openWebSocket(wsConfig)
  const wsSource = new WSSource(socket)

  const drained = Promise.allSettled([
    wsSource.readable.pipeThrough(rtsp.demuxer).pipeTo(consumer()),
    rtsp.commands.pipeTo(wsSource.writable),
  ])

  const sdp = await rtsp.describe()

  socket.close(1000)
  await drained

  return sdp
}
