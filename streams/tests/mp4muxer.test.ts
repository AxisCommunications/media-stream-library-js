import { Mp4Muxer } from 'components/mp4muxer'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

// tests
describe('mp4muxer component', (test) => {
  const mp4muxer = new Mp4Muxer()
  runComponentTests(mp4muxer, 'mp4muxer', test)
})
