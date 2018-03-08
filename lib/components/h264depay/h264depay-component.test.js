const validateComponent = require('../../utils/validate-component')
const H264DepayComponent = require('./')

describe('is a valid component', () => {
  const c = new H264DepayComponent(99)
  validateComponent(c, 'h264Depay component')
})
