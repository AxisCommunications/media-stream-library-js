import React, { useContext, useCallback } from 'react'

import { FoundationContext, Area, BBox } from './Foundation'
import { bbox, Coord, CoordArray } from './utils/geometry'

const clamp = (lo: number, value: number, hi: number) => {
  return Math.min(Math.max(lo, value), hi)
}

export interface LinerContextProps {
  readonly areaBBox: BBox
  readonly clampCoord: (point: Coord) => Coord
  readonly clampCoordArray: (points: CoordArray) => CoordArray
  readonly clampBBox: (bbox: BBox) => BBox
}

export const LinerContext = React.createContext<LinerContextProps>({
  areaBBox: {
    x: -Infinity,
    y: -Infinity,
    width: Infinity,
    height: Infinity,
    x2: Infinity,
    y2: Infinity,
  },
  clampCoord: (point) => point,
  clampCoordArray: (points) => points,
  clampBBox: (bbox) => bbox,
})

export interface LinerProps {
  readonly area?: Area
}

export const Liner: React.FC<LinerProps> = ({ area, children }) => {
  const { userBasis, toSvgBasis } = useContext(FoundationContext)

  const areaUserBasis = area ?? userBasis
  const areaSvgBasis = areaUserBasis.map(toSvgBasis)
  const areaBBox = bbox(areaSvgBasis)

  // Function that limits a point within the area's bounding box
  const clampCoord = useCallback(
    (point: Coord): Coord => {
      const [x, y] = point
      return [
        clamp(areaBBox.x, x, areaBBox.x2),
        clamp(areaBBox.y, y, areaBBox.y2),
      ]
    },
    [areaBBox],
  )

  // Function that limits a set of points within the area's bounding box
  const clampCoordArray = useCallback(
    (points: CoordArray): CoordArray => {
      // compute bounding box of the points
      const { x, y, width, height } = bbox(points)
      // limit the bbox origin so the points fall inside the liner
      const x2 = areaBBox.x2 - width
      const y2 = areaBBox.y2 - height
      const dx = clamp(areaBBox.x, x, x2) - x
      const dy = clamp(areaBBox.y, y, y2) - y
      // apply reverse translation
      return points.map(([x, y]) => [x + dx, y + dy])
    },
    [areaBBox],
  )

  const clampBBox = useCallback(
    (bbox: BBox): BBox => {
      const { x, y, width, height } = bbox
      return {
        x: clamp(areaBBox.x, x, areaBBox.x2 - width),
        y: clamp(areaBBox.y, y, areaBBox.y2 - height),
        width,
        height,
      }
    },
    [areaBBox],
  )

  return (
    <LinerContext.Provider
      value={{
        areaBBox,
        clampCoord,
        clampCoordArray,
        clampBBox,
      }}
    >
      {children}
    </LinerContext.Provider>
  )
}
