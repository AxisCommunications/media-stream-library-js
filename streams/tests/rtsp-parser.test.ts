import { RtspParser } from 'components/rtsp-parser'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

describe('rtsp-parser component', (test) => {
  const c = new RtspParser()
  runComponentTests(c, 'rtsp-parser', test)
})
