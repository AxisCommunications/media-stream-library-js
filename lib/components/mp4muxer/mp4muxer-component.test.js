// internal classes
// const Component = require('../component');
const Mp4MuxerComponent = require('./')
// internal classes

// utils
// const StreamFactory = require('../helpers/stream-factory');

// tests
const validateComponent = require('../../utils/validate-component')

const mp4muxer = new Mp4MuxerComponent()
validateComponent(mp4muxer, 'mp4muxer component')
