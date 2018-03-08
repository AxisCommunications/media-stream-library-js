// internal classes
// const Component = require('../component');
const InspectorComponent = require('./')
// internal classes

// utils
// const StreamFactory = require('../helpers/stream-factory');

// tests
const validateComponent = require('../../utils/validate-component')

const inspector = new InspectorComponent()
validateComponent(inspector, 'inspector component')
