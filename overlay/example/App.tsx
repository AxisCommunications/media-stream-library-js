import React, { useState } from 'react'

import {
  Foundation,
  Liner,
  CoordArray,
  Coord,
  Area,
} from 'media-overlay-library'

import {
  Circle,
  DraggableCircle,
  FastDraggableCircle,
} from './components/Circle'
import { Polygon } from './components/Polygon'
import { Text } from './components/Text'

const USER_BASIS: Area = [
  [-1, 1], // top left coordinate
  [1, -1], // bottom right coordinate
]

const MIDDLE_AREA: Area = [
  [-0.5, 0.5], // top left coordinate
  [0.5, -0.5], // bottom right coordinate
]

const App: React.FC = () => {
  const [textPos1, setTextPos1] = useState<Coord>([-1, 0.8])
  const [textPos2, setTextPos2] = useState<Coord>([-0.4, -0.5])
  const [polygonPos, setPolygonPos] = useState<CoordArray>([
    [0.6, 0.1],
    [0.8, 0.2],
    [0.7, 0.5],
    [0.3, 0.2],
  ])
  const [circle1Pos, setCircle1Pos] = useState<Coord>([-0.3333, 0.3333])
  const [circle2Pos, setCircle2Pos] = useState<Coord>([0.2, -0.5])
  const [circle3Pos, setCircle3Pos] = useState<Coord>([-0.5, -0.3001])

  return (
    <div className="main">
      <header>
        <h1>Welcome to media-overlay-library</h1>
      </header>
      <p>
        To get started, edit <code>src/App.tsx</code> and save to reload.
      </p>

      <Foundation
        width={640}
        height={480}
        userBasis={USER_BASIS}
        style={{
          border: '1px solid deepskyblue',
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
          <Circle pos={circle1Pos} onChangePos={setCircle1Pos} r={5} />
          <DraggableCircle
            pos={circle2Pos}
            onChangePos={setCircle2Pos}
            r={10}
          />

          <Liner area={MIDDLE_AREA}>
            <FastDraggableCircle
              id={'5'}
              pos={circle3Pos}
              onChangePos={setCircle3Pos}
              r={20}
            />
          </Liner>
        </Liner>
      </Foundation>
    </div>
  )
}

export default App
