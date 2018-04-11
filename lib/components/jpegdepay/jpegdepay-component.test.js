const validateComponent = require('../../utils/validate-component')
const JpegDepayComponent = require('./')

describe('JPEG depay component', () => {
  describe('is a valid component', () => {
    const c = new JpegDepayComponent()
    validateComponent(c, 'JPEG depay component')
  })
})
