import 'global-jsdom/register'

import { CanvasSink } from 'components/canvas'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

describe('canvas component', (test) => {
  const fakeCanvas = document.createElement('canvas')
  fakeCanvas.getContext = () => null
  const canvasComponent = new CanvasSink(fakeCanvas)
  runComponentTests(canvasComponent, 'Canvas', test)
})
