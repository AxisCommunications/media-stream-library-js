export type Authenticator = () => Promise<string>

export type Environment = 'prod' | 'stage'

export type Message =
  | InitSessionMessage
  | HelloMessage
  | ErrorMessage
  | SDPSignalingMessage
  | IceSignalingMessage
  | InitSessionSignalingMessage

export interface ErrorMessage {
  readonly type: 'error'
  readonly correlationId?: string
  readonly id?: string
  readonly code?: string
  readonly reason?: string
}

export interface WebRTCVideoReceive {
  readonly width?: number
  readonly height?: number
  readonly channel?: number
  readonly framerate?: number
  readonly maxBitrateInKbps?: number
  readonly zGopMode?: string // dynamic | fixed
  readonly zStrength?: 'off' | number // 10, 20, 30, 40, 50
  readonly rotation?: number // 0, 90, 180, 270
  readonly streamProfile?: string
}

export interface InitSessionMessage {
  readonly type: 'initSession'
  readonly correlationId?: string
  readonly id?: string
  readonly orgId?: string
  readonly targetId?: string
  readonly accessToken?: string
  readonly data: {
    readonly apiVersion?: string
    readonly method: 'initSession'
    readonly type: 'request' | 'response'
    readonly sessionId: string
    readonly params: {
      type: 'live'
      readonly audioReceive?: Record<string, never>
      readonly videoReceive: WebRTCVideoReceive
    }
  }
  readonly turnServers?: ReadonlyArray<{
    readonly urls: ReadonlyArray<string>
    // valid for 10 minutes
    readonly username: string
    // valid for 10 minutes
    readonly password: string
  }>
  readonly stunServers?: ReadonlyArray<{
    readonly urls: Array<string>
  }>
}

export interface HelloMessage {
  readonly type: 'hello'
  readonly correlationId?: string
  readonly id?: string
}

export interface SDPSignalingMessage {
  readonly type: 'signaling'
  readonly correlationId?: string
  readonly orgId?: string
  readonly targetId?: string
  readonly accessToken?: string
  readonly data: {
    readonly data?: unknown
    readonly error?: {
      readonly code: string
      readonly message: string
    }
    readonly sessionId: string
    readonly method: 'setSdpOffer' | 'setSdpAnswer'
    readonly apiVersion?: string
    readonly type: 'request' | 'response'
    readonly params: {
      readonly type: 'offer' | 'answer' | 'pranswer' | 'rollback'
      readonly sdp?: string
    }
  }
}

export interface IceSignalingMessage {
  readonly type: 'signaling'
  readonly correlationId?: string
  readonly orgId?: string
  readonly targetId?: string
  readonly accessToken?: string
  readonly data: {
    readonly data?: unknown
    readonly error?: {
      readonly code: string
      readonly message: string
    }
    readonly sessionId: string
    readonly method: 'addIceCandidate'
    readonly apiVersion?: string
    readonly type: 'request' | 'response'
    readonly params: {
      readonly candidate: string
      readonly sdpMLineIndex: number | null
      readonly sdpMid: string | null
      readonly usernameFragment: string | null
    }
  }
}

export interface InitSessionSignalingMessage {
  readonly type: 'signaling'
  readonly correlationId?: string
  readonly orgId?: string
  readonly targetId?: string
  readonly accessToken?: string
  readonly data: {
    readonly sessionId: string
    readonly method: 'initSession'
    readonly apiVersion?: string
    readonly type: 'response'
    readonly data?: unknown
    readonly error?: {
      readonly code: string
      readonly message: string
    }
  }
}

export interface SessionListener {
  onTrack: (streams: ReadonlyArray<MediaStream>) => void
}
