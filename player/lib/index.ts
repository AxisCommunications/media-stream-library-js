import { MediaStreamPlayer } from './MediaStreamPlayer'

export * from './Player'
export * from './Container'
export * from './PlaybackArea'
export * from './Stats'
export * from './utils'

window.customElements.define('media-stream-player', MediaStreamPlayer)
