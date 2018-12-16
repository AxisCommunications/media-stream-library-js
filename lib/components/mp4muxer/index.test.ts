import { runComponentTests } from '../../utils/validate-component'
import { Mp4Muxer } from '.'

// tests
const mp4muxer = new Mp4Muxer()
runComponentTests(mp4muxer, 'mp4muxer component')
