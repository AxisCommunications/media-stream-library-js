#!/usr/bin/env node

import { connect } from 'node:net'
import { WebSocketServer } from 'ws'

function usage() {
  console.error(`
Usage: ws-rtsp-proxy <port-map> [<port-map> ...]

Options:
 port-map       A map of WebSocket server port (proxy) to RTSP server port (destination)
                Example: 8854:8554
`)
}

const [...portmaps] = process.argv.slice(2)

if (portmaps.length === 0) {
  usage()
  process.exit(1)
}

for (const portmap of portmaps) {
  const [wsPort, rtspPort] = portmap.split(':')
  console.log(
    `starting WebSocket server at ws://localhost:${wsPort} proxying data to rtsp://localhost:${rtspPort}`
  )

  const wss = new WebSocketServer({ host: '::', port: Number(wsPort) })
  let rtspSocket
  wss.on('connection', (webSocket) => {
    rtspSocket?.destroy()

    console.log('new connection', new Date())

    rtspSocket = connect(Number(rtspPort) || 554)

    // pass incoming messages to the RTSP server
    webSocket.on('message', (data) => {
      rtspSocket.write(data)
    })
    webSocket.on('error', (err) => {
      console.error('WebSocket fail:', err)
      rtspSocket.end()
    })
    // pass data from the RTSP server back through the WebSocket
    rtspSocket.on('data', (data) => {
      webSocket.send(data)
    })
    rtspSocket.on('error', (err) => {
      console.error('RTSP socket fail:', err)
      webSocket.close()
    })
  })

  wss.on('error', (err) => {
    console.error('WebSocket server fail:', err)
  })
}
