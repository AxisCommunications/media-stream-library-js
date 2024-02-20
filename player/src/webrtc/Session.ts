import debug from 'debug'

import { Signaling, SignalingListener } from './Signaling'
import {
  Authenticator,
  Environment,
  SessionListener,
  WebRTCVideoReceive,
} from './types'

const debugLog = debug('msp:webrtc-video')

export class Session {
  authenticator: Authenticator
  organizationArn: string
  targetId: string
  options: WebRTCVideoReceive
  env: Environment
  peerConnection: RTCPeerConnection
  signaling?: Signaling
  listener: SessionListener
  sessionId: string

  constructor(
    authenticator: Authenticator,
    organizationArn: string,
    targetId: string,
    options: WebRTCVideoReceive,
    listener: SessionListener,
    env: Environment = 'prod'
  ) {
    this.sessionId = crypto.randomUUID()
    this.authenticator = authenticator
    this.organizationArn = organizationArn
    this.targetId = targetId
    this.options = options
    this.listener = listener
    this.env = env
    this.peerConnection = new RTCPeerConnection()
  }

  init() {
    this.peerConnection.onconnectionstatechange = () => {
      debugLog('connections state change', this.peerConnection.connectionState)

      if (this.peerConnection.connectionState === 'disconnected') {
        debugLog(
          'PeerConnection.onconnectionstatechange',
          'disconnected',
          this.peerConnection
        )
        // Try to reconnect
        if (this.signaling === undefined) {
          debugLog(
            'PeerConnection.onconnectionstatechange',
            'disconnected',
            'Trying to reconnect but signaling is undefined'
          )
        }
        this.signaling?.connect().catch(console.trace)
      }

      if (this.peerConnection.connectionState === 'failed') {
        debugLog(
          'PeerConnection.onconnectionstatechange',
          'failed',
          this.peerConnection
        )
      }

      if (this.peerConnection.connectionState === 'connected') {
        debugLog(
          'PeerConnection.onconnectionstatechange',
          'connected',
          this.peerConnection
        )
      }
    }

    this.peerConnection.onicecandidate = (ev) => {
      debugLog('PeerConnection.onicecandidate', ev)
      if (ev.candidate !== null) {
        this.signaling?.sendLocalIceCandidate(ev.candidate).catch(console.trace)
      }
    }

    this.peerConnection.ontrack = (ev) => {
      debugLog('PeerConnection.ontrack', ev)
      this.listener.onTrack(ev.streams)
    }

    const listeners: SignalingListener = {
      onIceServers: (iceServers: Array<RTCIceServer>) => {
        this.peerConnection.setConfiguration({ iceServers })
      },

      onRemoteSessionDescription: (
        signaling: Signaling,
        sessionDescription: RTCSessionDescriptionInit
      ) =>
        (async () => {
          if (this.peerConnection === undefined) {
            return
          }

          await this.peerConnection.setRemoteDescription(sessionDescription)
          const localSessionDescription: RTCSessionDescriptionInit = await this
            .peerConnection.createAnswer()
          await this.peerConnection.setLocalDescription(
            localSessionDescription
          )

          signaling.sendLocalDescription(localSessionDescription).catch(
            console.trace
          )
        })(),

      onError: (
        errorCode: string,
        errorDescription: string
      ) => debugLog('SignalingListener.onError', errorCode, errorDescription),

      onRemoteIceCandidate: (
        iceCandidate: RTCIceCandidateInit
      ) => {
        if (this.peerConnection === undefined) {
          debugLog(
            'SignalingListener.onRemoteIceCandiate',
            'peerConnection not yet initialized'
          )
          return
        }

        this.peerConnection.addIceCandidate(iceCandidate).catch(console.trace)
      },
    }

    this.signaling = new Signaling(
      this.authenticator,
      this.organizationArn.replace('arn:organization:', ''),
      this.targetId,
      this.options,
      listeners,
      this.env
    )

    this.signaling.connect().catch(console.trace)
  }

  close() {
    debugLog('Session.close', this.sessionId)
    this.signaling?.disconnect()
    this.peerConnection?.close()
  }
}
