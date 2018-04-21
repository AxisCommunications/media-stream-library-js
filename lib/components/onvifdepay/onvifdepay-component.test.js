const validateComponent = require('../../utils/validate-component')
const OnvifDepayComponent = require('./')

describe('ONVIF depay component', () => {
  describe('is a valid component', () => {
    const c = new OnvifDepayComponent()
    validateComponent(c, 'ONVIF depay component')
  })
})
