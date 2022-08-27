import 'global-jsdom/register'

import { MseSink } from 'components/mse'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

// tests
describe('mse component', (test) => {
  const mse = new MseSink(document.createElement('video'))
  runComponentTests(mse, 'mse', test)
})
