import { TcpSource } from '.'
import { runComponentTests } from '../../utils/validate-component'

describe('is a valid component', () => {
  const c = new TcpSource()
  runComponentTests(c, 'TCP component')
})
