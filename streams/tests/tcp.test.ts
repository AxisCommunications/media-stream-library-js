import { TcpSource } from 'components/tcp'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

describe('tcp component', (test) => {
  const c = new TcpSource()
  runComponentTests(c, 'tcp', test)
})
