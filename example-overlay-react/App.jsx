import React, { useState } from 'react'

import {
  Foundation,
  Liner,
} from 'media-stream-library/overlay'

import {
  Circle,
  DraggableCircle,
  FastDraggableCircle,
} from './Circle'
import { Polygon } from './Polygon'
import { Text } from './Text'

const USER_BASIS = [
  [-1, 1], // top left coordinate
  [1, -1], // bottom right coordinate
]

const MIDDLE_AREA = [
  [-0.5, 0.5], // top left coordinate
  [0.5, -0.5], // bottom right coordinate
]

const App = () => {
  const [textPos1, setTextPos1] = useState([-1, 0.8])
  const [textPos2, setTextPos2] = useState([-0.4, -0.5])
  const [textPos3, setTextPos3] = useState([-0.5, 0])
  const [polygonPos, setPolygonPos] = useState([
    [0.6, 0.1],
    [0.8, 0.2],
    [0.7, 0.5],
    [0.3, 0.2],
  ])
  const [circle1Pos] = useState([-0.3333, 0.3333])
  const [circle2Pos, setCircle2Pos] = useState([0.2, -0.5])
  const [circle3Pos, setCircle3Pos] = useState([-0.5, -0.3001])

  return (
    <div className="main">
      <header>
        <h1>MSL Overlay Playground</h1>
      </header>
      <p>
        To get started, edit <code>src/App.tsx</code> and save to reload.
      </p>
      <div style={{
        position: 'relative',
        width: '80vw',
        height: '80vh',
        border: '1px solid deepskyblue',
      }}>
        <Foundation
          userBasis={USER_BASIS}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            left: '0',
            top: '0',
            right: '0',
            bottom: '0',
          }}
        >
          <Text x={textPos1[0]} y={textPos1[1]} onChangePos={setTextPos1}>
            I can be dragged outside of the visible area
          </Text>
          <Liner>
            <Text x={textPos2[0]} y={textPos2[1]} onChangePos={setTextPos2}>
              I can be dragged but I am limited to the visible area
            </Text>
            <Polygon pos={polygonPos} onChangePos={setPolygonPos} />
            <Circle pos={circle1Pos} r={5} />
            <DraggableCircle
              pos={circle2Pos}
              onChangePos={setCircle2Pos}
              r={10}
            />

            <Liner area={MIDDLE_AREA}>
              <FastDraggableCircle
                id="5"
                pos={circle3Pos}
                onChangePos={setCircle3Pos}
                r={20}
              />
            </Liner>
          </Liner>
        </Foundation>

        <Foundation
          userBasis={USER_BASIS}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            left: '0',
            top: '0',
            right: '0',
            bottom: '0',
          }}
          clickThrough={true}
        >
          <Text x={textPos3[0]} y={textPos3[1]} onChangePos={setTextPos3}>
            I am in another Foundation above everything else and you can still
            interact with the SVGs below me
          </Text>
        </Foundation>
      </div>
    </div>
  )
}

export default App
