import { ONVIFDepay } from '.'
import { runComponentTests } from '../../utils/validate-component'

describe('ONVIF depay component', () => {
  describe('is a valid component', () => {
    const c = new ONVIFDepay()
    runComponentTests(c, 'ONVIF depay component')
  })
})
