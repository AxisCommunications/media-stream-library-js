import { CanvasSink } from '.'
import { runComponentTests } from '../../utils/validate-component'

describe('Canvas component', () => {
  describe('is a valid component', () => {
    const fakeCanvas = document.createElement('canvas')
    fakeCanvas.getContext = () => null
    const canvasComponent = new CanvasSink(fakeCanvas)
    runComponentTests(canvasComponent, 'Canvas component')
  })
})
