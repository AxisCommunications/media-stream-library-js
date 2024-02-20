import { VapixParameters } from '../PlaybackArea'

import { WebRTCVideoReceive } from './types'

type OptionalVapixParameters = {
  [Parameter in keyof VapixParameters]: Parameter | undefined
}

// Maps VAPIX parameters to webRTC videoRecieve parameters
export const vapixParameterToVideoReceive = (
  parameters: OptionalVapixParameters
): WebRTCVideoReceive =>
  Object.entries(parameters).reduce<WebRTCVideoReceive>(
    (values, [key, value]) => {
      if (value === undefined) {
        return values
      }

      if (key === 'resolution') {
        const [width, height] = value.split('x').map((v) => parseInt(v, 10))
        return {
          ...values,
          width,
          height,
        }
      }

      if (key === 'camera') {
        const channel = parseInt(value, 10)
        return {
          ...values,
          channel,
        }
      }

      if (key === 'fps') {
        const framerate = parseInt(value, 10)
        return {
          ...values,
          framerate,
        }
      }

      if (key === 'videomaxbitrate') {
        const maxBitrateInKbps = parseInt(value, 10)
        return {
          ...values,
          maxBitrateInKbps,
        }
      }

      if (key === 'videozgopmode') {
        return {
          ...values,
          zGopMode: value,
        }
      }

      if (key === 'videozstrength') {
        let zStrength: Exclude<WebRTCVideoReceive['zStrength'], undefined> =
          'off'
        if (value !== 'off') {
          zStrength = parseInt(value, 10)
        }
        return {
          ...values,
          zStrength,
        }
      }

      if (key === 'rotation') {
        const rotation = parseInt(value, 10)
        return {
          ...values,
          rotation,
        }
      }

      if (key === 'streamprofile') {
        return {
          ...values,
          streamProfile: value,
        }
      }

      return values
    },
    {}
  )
