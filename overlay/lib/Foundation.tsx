import React, { useMemo, useEffect } from 'react'

import { multiply, inverse, apply, Matrix } from './utils/affine'
import { Coord, CoordArray } from './utils/geometry'

// Prototype of an Svg implementation with basis transform capabilities.

/**
 * Set up basis transforms.
 * The svg basis is defined as:
 *
 * (0,0)      (w,0)
 *   +----------+
 *   |          |
 *   |          |
 *   |          |
 *   +----------+
 * (0,h)      (w,h)
 *
 * where the top left corner is the origin, and the bottom
 * right corner corresponds to the width and height of the
 * svg element.
 *
 * A user basis can be defined to allow the use of
 * custom coordinates instead of those based on
 * width and height of the svg element.
 * The basis that can be chosen is limited to a
 * rectangular overlay, defined by two outer points:
 *
 * (x0,y0)    (x1,y0)
 *    +----------+
 *    |          |
 *    |          |
 *    |          |
 *    +----------+
 * (x0,y1)    (x1,y1)
 *
 * The user basis is passed as a prop with data
 * [[x0, y0], [x1, y1]], and if not specified the default
 * corresponds to [[0, 1], [1, 0]].
 *
 * To allow n * pi/2 rotations to map the space onto itself
 * an intermediate basis is used with a centered origin and
 * equal distance to the edges, called the normalized basis.
 */

/**
 * An area is represented by the top left and bottom right
 * corner coordinates.
 */
export type Area = [Coord, Coord]

/**
 * A boundix box is represented by the top left and bottom right
 * corner coordinates.
 *
 * We use an over-specified bounding box so that it can easily be
 * applied to a variety of use cases:
 *
 *  top-left corner = (x,y) = (left, top)
 *  bottom-right corner = (x2, y2) = (right, bottom)
 *  width = |x2 - x| = |right - left|
 *  height = |y2 - y| = |bottom - top|
 */
export type BBox = {
  readonly x: number
  readonly y: number
  readonly x2?: number
  readonly y2?: number
  readonly width: number
  readonly height: number
  readonly top?: number
  readonly left?: number
  readonly bottom?: number
  readonly right?: number
}

const DEFAULT_USER_BASIS: Area = [
  [0, 0],
  [9999, 9999],
]
const NORMALIZED_BASIS: Area = [
  [-1, 1],
  [1, -1],
]

const svgBasisTransform = (
  w: number,
  h: number,
  [[x0, y0], [x1, y1]]: Area,
): Matrix => {
  return [
    [w / (x1 - x0), 0, (w * x0) / (x0 - x1)],
    [0, h / (y1 - y0), (h * y0) / (y0 - y1)],
    [0, 0, 1],
  ]
}

const throwIfNoFoundationProvider = () => {
  throw new Error(
    'Your Foundation Consumer is not wrapped in a Foundation Provider',
  )
}

export interface FoundationContextProps {
  userBasis: Area
  toSvgBasis: (p: Coord) => Coord
  toUserBasis: (p: Coord) => Coord
}

export const FoundationContext = React.createContext<FoundationContextProps>({
  userBasis: DEFAULT_USER_BASIS,
  toSvgBasis: throwIfNoFoundationProvider,
  toUserBasis: throwIfNoFoundationProvider,
})

export interface FoundationProps extends React.SVGProps<SVGSVGElement> {
  /**
   * Width of the visible area in pixels
   */
  readonly width: number
  /**
   * Height of the visible area in pixels
   */
  readonly height: number
  /**
   * Area representing the user coordinates
   */
  readonly userBasis?: Area
  /**
   * Transformation matrix mapping the visible area
   * onto the original (full) area.
   */
  readonly transformationMatrix?: Matrix
  /**
   * Callback returning the use coordinates of the
   * visible area (same as user are if no transform).
   */
  readonly onReady?: (visibleArea: BBox) => void
  /**
   * Extra style overrides for the <svg> container
   */
  readonly style?: React.CSSProperties
  /**
   * Classname for the <svg> container
   */
  readonly className?: string
}

export const Foundation = React.forwardRef<
  SVGSVGElement,
  React.PropsWithChildren<FoundationProps>
>(
  (
    {
      width,
      height,
      userBasis = DEFAULT_USER_BASIS,
      transformationMatrix,
      onReady,
      className,
      children,
      ...svgProps
    },
    ref,
  ) => {
    const { toSvgBasis, toUserBasis } = useMemo(() => {
      // Set up basis transform from user to svg space:
      // p_s = bSU p_u
      let bSU = svgBasisTransform(width, height, userBasis)
      if (transformationMatrix !== undefined) {
        /**
         * A transform maps the visible area (svg basis)
         * to the full area (user basis): p_U = T p_S
         * where T is an affine transformation matrix
         * (given in row-major order).
         */

        // Use intermediate space to perform the transformormation:
        // p_s = bSN T_nn^-1 bNU p_u
        const bSN = svgBasisTransform(width, height, NORMALIZED_BASIS)
        // bNU can be computed from
        // p_s = bSN p_n = bSU p_u and p_n = bNU p_u
        // => p_n = bSN^-1 bSU p_u
        // => bNU = bSN^-1 bSU
        const bNU = multiply(inverse(bSN), bSU)
        bSU = multiply(bSN, multiply(inverse(transformationMatrix), bNU))
      }
      const bUS = inverse(bSU)
      const toSvgBasis = (p: Coord) => apply(bSU, p)
      const toUserBasis = (p: Coord) => apply(bUS, p)

      return { toSvgBasis, toUserBasis }
    }, [width, height, userBasis, transformationMatrix])

    useEffect(() => {
      if (onReady !== undefined) {
        const visibleCorners: CoordArray = [
          [0, 0],
          [width, height],
        ]
        const visibleArea = visibleCorners.map(toUserBasis)
        const [[x, y], [x2, y2]] = visibleArea
        onReady({
          x,
          y,
          x2,
          y2,
          width: Math.abs(x2 - x),
          height: Math.abs(y2 - y),
          left: x,
          right: x2,
          top: y,
          bottom: y2,
        })
      }
    }, [width, height, toUserBasis])

    return (
      <FoundationContext.Provider
        value={{
          userBasis,
          toSvgBasis,
          toUserBasis,
        }}
      >
        <svg
          width={width}
          height={height}
          className={className}
          touch-action="none"
          ref={ref}
          {...svgProps}
        >
          {children}
        </svg>
      </FoundationContext.Provider>
    )
  },
)

Foundation.displayName = 'Foundation'
