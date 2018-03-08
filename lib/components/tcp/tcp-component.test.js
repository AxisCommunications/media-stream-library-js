const validateComponent = require('../../utils/validate-component')
const TcpComponent = require('./')

describe('is a valid component', () => {
  const c = new TcpComponent()
  validateComponent(c, 'TCP component')
})
