import { Inspector } from 'components/inspector'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

// utils
// const StreamFactory = require('../helpers/stream-factory');

// tests
const inspector = new Inspector()
describe('inspector component', (test) => {
  runComponentTests(inspector, 'inspector', test)
})
