// internal classes
const Component = require('../component')
const MediaComponent = require('./mse-component')
// internal classes

// utils
const StreamFactory = require('../helpers/stream-factory')

// mocks
// const {MediaSourceElement} = require('mock-mse');

// tests
const validateComponent = require('../../utils/validate-component')

// const mse = new MediaSourceElement();

// Implement a really cool source buffer
class SourceBuffer {
  constructor () {
    this.updating = false
    this.start = 0
    this.end = 0
    this.buffered = {
      length: 1,
      start: () => this.start,
      end: () => this.end
    }
  }
  append () {
    this.updating = true
    setTimeout(() => {
      this.end = this.end + 1 // Increase with 1 second per data event.
      this.updating = false
      this.onupdateend && this.onupdateend()
    }, 10)
  }
  remove (start, end) {
    this.start = end // Just chop of the beginning
  }
}

// Implement a totally useless media source.
class MediaSource {
  constructor () {
    this.readyState = 'open'
  }
  addSourceBuffer () {
    return new SourceBuffer()
  }
  endOfStream () {
    this.readyState = 'ended'
  }
};

const source = new Component(StreamFactory.producer(), StreamFactory.consumer())
const sink = new MediaComponent(new MediaSource())

validateComponent(sink, 'media component')

source.connect(sink)
test('websocket component has two streams', () => {
  expect(source).toHaveProperty('incoming')
  expect(source).toHaveProperty('outgoing')
})
