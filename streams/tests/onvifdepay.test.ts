import { ONVIFDepay } from 'components/onvifdepay'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

describe('onvifdepay component', (test) => {
  const c = new ONVIFDepay()
  runComponentTests(c, 'onvifdepay', test)
})
