import { JPEGDepay } from 'components/jpegdepay'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

describe('JPEG depay component', (test) => {
  const c = new JPEGDepay()
  runComponentTests(c, 'jpegdepay', test)
})
