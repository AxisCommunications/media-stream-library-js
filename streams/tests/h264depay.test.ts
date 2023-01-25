import { H264Depay } from 'components/h264depay'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

describe('h264 component', (test) => {
  const c = new H264Depay()
  runComponentTests(c, 'h264depay', test)
})
