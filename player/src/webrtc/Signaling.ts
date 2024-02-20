import debug from 'debug'

import {
  Authenticator,
  Environment,
  IceSignalingMessage,
  InitSessionMessage,
  Message,
  SDPSignalingMessage,
  WebRTCVideoReceive,
} from './types'

const debugLog = debug('msp:webrtc-video')

export interface SignalingListener {
  onIceServers: (iceServers: Array<RTCIceServer>) => void
  onRemoteIceCandidate: (
    iceCandidate: RTCIceCandidateInit
  ) => void
  onRemoteSessionDescription: (
    signaling: Signaling,
    sessionDescription: RTCSessionDescriptionInit
  ) => void
  onError: (
    errorCode: string,
    errorDescription: string
  ) => void
}

export class Signaling {
  sessionId = ''
  authenticator: Authenticator
  organizationArn: string
  targetId: string
  env: Environment
  options: WebRTCVideoReceive
  listener: SignalingListener
  ws?: WebSocket

  constructor(
    authenticator: Authenticator,
    organizationArn: string,
    targetId: string,
    options: WebRTCVideoReceive,
    listener: SignalingListener,
    env: Environment = 'prod'
  ) {
    this.sessionId = crypto.randomUUID()
    this.authenticator = authenticator
    this.organizationArn = organizationArn
    this.targetId = targetId
    this.env = env
    this.options = options
    this.listener = listener
  }

  async connect() {
    if (this.ws !== undefined) {
      this.ws.close(1000, 're-initializing connection')
    }

    const baseUrl = `wss://signaling.${this.env}.webrtc.connect.axis.com/client`
    const bearer = encodeURIComponent(await this.authenticator())
    const url = `${baseUrl}?authorization=${bearer}`

    debugLog('Signaling.connect', `${baseUrl}?authorization=***`)

    this.ws = new WebSocket(url)

    this.ws.onerror = (ev) => {
      debugLog('wss.onerror', ev)
    }

    this.ws.onopen = () => {
      // Being polite
      this.send({
        type: 'hello',
      })
    }

    this.ws.onmessage = (e) => {
      const msg: Message = JSON.parse(e.data.toString())
      debugLog('Signaling.wss message', msg.type, e)
      this.onMessage(msg).catch(console.trace)
    }

    this.ws.onclose = (ev) => {
      debugLog('Signaling.wss websocket closed', ev.code, ev.reason)
    }
  }

  disconnect() {
    if (this.ws === undefined) {
      debugLog(`Signaling websocket is undefined`)
    }
    this.ws?.close(1000, 'disconnect')
  }

  send(msg: Message) {
    if (this.ws === undefined) {
      debugLog(`Signaling websocket is undefined`)
    }
    this.ws?.send(JSON.stringify(msg))
  }

  async onMessage(msg: Message) {
    switch (msg.type) {
      // Device responds with hello
      // We create a new message initSession
      case 'hello': {
        try {
          const accessToken = await this.authenticator()
          const initSessionMessage: InitSessionMessage = {
            type: 'initSession',
            accessToken,
            orgId: this.organizationArn,
            targetId: this.targetId,
            data: {
              apiVersion: '1.0',
              method: 'initSession',
              type: 'request',
              sessionId: this.sessionId,
              params: {
                audioReceive: {},
                type: 'live',
                videoReceive: {
                  ...this.options,
                },
              },
            },
          }
          this.send(initSessionMessage)
        } catch (e) {
          console.error(e)
        }

        break
      }
      case 'error': {
        debugLog('Signaling:onMessage.error', msg)
        break
      }
      // Device responds to initSession
      case 'initSession': {
        const iceServers: Array<RTCIceServer> = []
        if (msg.turnServers !== undefined) {
          msg.turnServers.forEach((server) => {
            iceServers.push({
              urls: [...server.urls],
              username: server.username,
              credential: server.password,
            })
          })
        }
        if (msg.stunServers !== undefined) {
          msg.stunServers.forEach((server) => {
            iceServers.push({ urls: [...server.urls] })
          })
        }

        this.listener.onIceServers(iceServers)
        break
      }
      case 'signaling': {
        if (msg.data.method === 'setSdpOffer' && msg.data.type === 'request') {
          this.listener.onRemoteSessionDescription(this, msg.data.params)
          return
        }
        if (
          msg.data.method === 'addIceCandidate'
          && msg.data.type === 'request'
        ) {
          this.listener.onRemoteIceCandidate(msg.data.params)
          return
        }
        if (msg.data.type === 'response' && msg.data.error !== undefined) {
          const { code, message } = msg.data.error
          this.listener.onError(code, message)
        }
      }
    }
  }

  async sendLocalIceCandidate(ic: RTCIceCandidate) {
    try {
      const accessToken = await this.authenticator()
      const msg: IceSignalingMessage = {
        type: 'signaling',
        accessToken,
        orgId: this.organizationArn,
        targetId: this.targetId,
        data: {
          apiVersion: '1.0',
          sessionId: this.sessionId,
          method: 'addIceCandidate',
          type: 'request',
          params: ic,
        },
      }
      this.send(msg)
    } catch (e) {
      console.error(e)
    }
  }

  async sendLocalDescription(sdp: RTCSessionDescriptionInit) {
    try {
      const accessToken = await this.authenticator()
      const msg: SDPSignalingMessage = {
        type: 'signaling',
        accessToken,
        orgId: this.organizationArn,
        targetId: this.targetId,
        data: {
          apiVersion: '1.0',
          sessionId: this.sessionId,
          method: 'setSdpAnswer',
          type: 'request',
          params: sdp,
        },
      }
      this.send(msg)
    } catch (e) {
      console.error(e)
    }
  }
}
