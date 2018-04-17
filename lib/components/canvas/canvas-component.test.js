const validateComponent = require('../../utils/validate-component')
const CanvasComponent = require('./')

describe('Canvas component', () => {
  describe('is a valid component', () => {
    const fakeCanvas = document.createElement('canvas')
    fakeCanvas.getContext = () => { }
    const canvasComponent = new CanvasComponent(fakeCanvas)
    validateComponent(canvasComponent, 'Canvas component')
  })
})
