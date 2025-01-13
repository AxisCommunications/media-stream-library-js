import { createConnection } from 'node:net'
import { Mp4Muxer, RtpDepay, RtspSession } from '../dist/streams/index.js'

class TcpSource {
  constructor(socket) {
    if (socket === undefined) {
      throw new Error('socket argument missing')
    }

    this.readable = new ReadableStream({
      start: (controller) => {
        socket.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        socket.on('end', () => {
          console.error('server closed connection')
          controller.close()
        })
      },
      cancel: () => {
        console.error('canceling TCP client')
        socket.close(CLOSE_ABORTED, 'client canceled')
      },
    })

    this.writable = new WritableStream({
      start: (controller) => {
        socket.on('end', () => {
          controller.error('socket closed')
        })
        socket.on('error', () => {
          controller.error('socket errored')
        })
      },
      write: (chunk) => {
        try {
          socket.write(chunk)
        } catch (err) {
          console.error('chunk lost during send:', err)
        }
      },
      close: () => {
        console.error('closing TCP client')
        socket.destroy('normal closure')
      },
      abort: (reason) => {
        console.error('aborting TCP client:', reason && reason.message)
        socket.destroy('abort')
      },
    })
  }
}

export async function start(rtspUri) {
  const url = new URL(rtspUri)
  const socket = createConnection(url.port, url.hostname)
  await new Promise((resolve) => {
    socket.once('connect', resolve)
  })

  const tcpSource = new TcpSource(socket)
  const rtspSession = new RtspSession({ uri: rtspUri })
  const rtpDepay = new RtpDepay()
  const mp4Muxer = new Mp4Muxer()

  const stdout = new WritableStream({
    write: (msg, controller) => {
      process.stdout.write(msg.data)
    },
  })

  rtspSession.play()

  return Promise.all([
    tcpSource.readable
      .pipeThrough(rtspSession.demuxer)
      .pipeThrough(rtpDepay)
      .pipeThrough(mp4Muxer)
      .pipeTo(stdout),
    rtspSession.commands.pipeTo(tcpSource.writable),
  ])
}
