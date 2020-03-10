import { MediaStreamPlayer } from './MediaStreamPlayer'

export * from './Player'
export * from './Container'
export * from './PlaybackArea'

window.customElements.define('media-stream-player', MediaStreamPlayer)
