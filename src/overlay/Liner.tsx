import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react'

import { Area, BBox, FoundationContext } from './Foundation'
import { Coord, CoordArray, bbox } from './utils/geometry'

const clamp = (lo: number, value: number, hi: number) => {
  return Math.min(Math.max(lo, value), hi)
}

export interface LinerContextProps {
  readonly areaBBox: BBox
  readonly clampCoord: (point: Coord) => Coord
  readonly clampCoordArray: (points: CoordArray) => CoordArray
  readonly clampBBox: (bbox: BBox) => BBox
}

export const LinerContext = createContext<LinerContextProps>({
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
  clampBBox: (b) => b,
})

export interface LinerProps {
  readonly area?: Area
  readonly children?: ReactNode
}

export const Liner: FC<LinerProps> = ({ area, children }) => {
  const { userBasis, toSvgBasis } = useContext(FoundationContext)

  const areaBBox = useMemo(() => {
    const areaUserBasis = area ?? userBasis
    const areaSvgBasis = areaUserBasis.map(toSvgBasis)
    return bbox(areaSvgBasis)
  }, [area, userBasis, toSvgBasis])

  // Function that limits a point within the area's bounding box
  const clampCoord = useCallback(
    (point: Coord): Coord => {
      const [x, y] = point
      return [
        clamp(areaBBox.x, x, areaBBox.x2),
        clamp(areaBBox.y, y, areaBBox.y2),
      ]
    },
    [areaBBox]
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
      return points.map(([px, py]) => [px + dx, py + dy])
    },
    [areaBBox]
  )

  const clampBBox = useCallback(
    ({ x, y, width, height }: BBox): BBox => ({
      x: clamp(areaBBox.x, x, areaBBox.x2 - width),
      y: clamp(areaBBox.y, y, areaBBox.y2 - height),
      width,
      height,
    }),
    [areaBBox]
  )

  const contextValue: LinerContextProps = useMemo(
    () => ({
      areaBBox,
      clampCoord,
      clampCoordArray,
      clampBBox,
    }),
    [areaBBox, clampCoord, clampCoordArray, clampBBox]
  )

  return (
    <LinerContext.Provider value={contextValue}>
      {children}
    </LinerContext.Provider>
  )
}
