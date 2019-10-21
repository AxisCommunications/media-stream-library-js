/* global cy */

// We need to disable specific linting because of Chai assertions:
// https://github.com/standard/standard/issues/690#issuecomment-278533482
/* eslint-disable no-unused-expressions */

const PRESENTATION_START = 0
const MAX_LATENCY = 0.25

describe('HTML5 video', function() {
  it('should auto-play with low latency', function() {
    cy.visit('http://localhost:8080/test/h264.html')
    cy.get('video').should($videoEl => {
      const videoEl = $videoEl.get(0)
      const presentationTime = videoEl.currentTime
      const latency = videoEl.buffered.end(0) - presentationTime
      expect(presentationTime).to.be.greaterThan(PRESENTATION_START)
      expect(latency).to.be.lessThan(MAX_LATENCY)
      expect(videoEl.paused).to.be.false
    })
  })
})
