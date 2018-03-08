// internal classes
// const Component = require('../component');
const XmlParserComponent = require('./')
// internal classes

// utils
// const StreamFactory = require('../helpers/stream-factory');

// tests
const validateComponent = require('../../utils/validate-component')

const xmlParser = new XmlParserComponent()
validateComponent(xmlParser, 'xmlParser component')
