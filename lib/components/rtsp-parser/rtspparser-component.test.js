const validateComponent = require('../../utils/validate-component')
const RtspParserComponent = require('./')

describe('is a valid component', () => {
  const c = new RtspParserComponent()
  validateComponent(c, 'Rtsp parser component')
})
