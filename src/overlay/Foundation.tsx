import React, {
  createContext,
  CSSProperties,
  forwardRef,
  HTMLAttributes,
  PropsWithChildren,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Matrix, apply, inverse, multiply } from './utils/affine'
import { Coord } from './utils/geometry'

type BaseElement = HTMLDivElement
type BaseProps = HTMLAttributes<BaseElement>

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
export type Area = readonly [Coord, Coord]

/**
 * A bounding box is represented by the top left and bottom right
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
export interface BBox {
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
  [[x0, y0], [x1, y1]]: Area
): Matrix => {
  return [
    [w / (x1 - x0), 0, (w * x0) / (x0 - x1)],
    [0, h / (y1 - y0), (h * y0) / (y0 - y1)],
    [0, 0, 1],
  ]
}

const throwIfNoFoundationProvider = () => {
  throw new Error(
    'Your Foundation Consumer is not wrapped in a Foundation Provider'
  )
}

export type CoordTransform = (P: Coord) => Coord

export interface FoundationContextProps {
  readonly userBasis: Area
  readonly toSvgBasis: CoordTransform
  readonly toUserBasis: CoordTransform
}

export const FoundationContext = createContext<FoundationContextProps>({
  userBasis: DEFAULT_USER_BASIS,
  toSvgBasis: throwIfNoFoundationProvider,
  toUserBasis: throwIfNoFoundationProvider,
})

export interface TransformData {
  readonly toSvgBasis: CoordTransform
  readonly toUserBasis: CoordTransform
  readonly width: number
  readonly height: number
}

export interface FoundationProps extends BaseProps {
  /**
   * Width of the visible area in pixels
   */
  readonly initialWidth?: number
  /**
   * Height of the visible area in pixels
   */
  readonly initialHeight?: number
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
   * Callback returning the size and transformation functions for the drawing
   * area. These can be used to pre-compute the user coordinates of objects with
   * a known position on the drawing area.
   * The callback will be called each time width or height changes.
   *
   * Example: compute the visible area of a stream in user coordinates,
   * using `width`, `height`, and `toUserBasis` data from `onReady`:
   * ```
   * const visibleCorners: CoordArray = [[0, 0],[width, height]]
   * const visibleArea = visibleCorners.map(toUserBasis)
   * const [[x, y], [x2, y2]] = visibleArea
   * ```
   */
  readonly onReady?: (data: TransformData) => void
  /**
   * Extra style overrides for the <svg> container
   */
  readonly style?: CSSProperties
  /**
   * Classname for the <svg> container
   */
  readonly className?: string
  /**
   * Should Foundation respond to pointer events
   */
  readonly clickThrough?: boolean
}

export const Foundation = forwardRef<
  BaseElement,
  PropsWithChildren<FoundationProps>
>(
  (
    {
      initialWidth,
      initialHeight,
      userBasis = DEFAULT_USER_BASIS,
      transformationMatrix,
      onReady,
      className = '',
      clickThrough = false,
      children,
      ...externalProps
    },
    ref
  ) => {
    const [width, setWidth] = useState(initialWidth)
    const [height, setHeight] = useState(initialHeight)

    /**
     * Compute the transformation functions to go from
     * user coordinates to SVG coordinates and back.
     */
    const { toSvgBasis, toUserBasis } = useMemo(() => {
      if (
        width === undefined ||
        width <= 0 ||
        height === undefined ||
        height <= 0
      ) {
        return {}
      }
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

      return {
        toSvgBasis: (p: Coord) => apply(bSU, p),
        toUserBasis: (p: Coord) => apply(bUS, p),
      }
    }, [width, height, userBasis, transformationMatrix])

    /**
     * Communicate the transformation functions to the outside world,
     * as well as the visible area in user coordinates.
     */
    useEffect(() => {
      if (
        onReady !== undefined &&
        width !== undefined &&
        height !== undefined &&
        toSvgBasis !== undefined &&
        toUserBasis !== undefined
      ) {
        onReady({
          toUserBasis,
          toSvgBasis,
          width,
          height,
        })
      }
    }, [width, height, toUserBasis, toSvgBasis, onReady])

    /**
     * Keep track of the SVG element (both internally and externally forwarded).
     */
    const internalRef = useRef<BaseElement | null>(null)
    const callbackRef = useCallback(
      (node: BaseElement | null) => {
        // Set the external forwarded ref if present
        if (ref !== null) {
          if (typeof ref === 'function') {
            ref(node)
          } else {
            ref.current = node
          }
        }
        // Keep track of the element internally
        internalRef.current = node
      },
      [ref]
    )

    /**
     * Keep track of the size of the SVG drawing area and adjust width/height.
     */
    useLayoutEffect(() => {
      if (internalRef.current === null) {
        return
      }

      const setDimensions = (el: Element) => {
        setWidth(el.clientWidth)
        setHeight(el.clientHeight)
      }

      const observer = new window.ResizeObserver(([entry]) => {
        const element = entry.target
        setDimensions(element)
      })

      setDimensions(internalRef.current)
      observer.observe(internalRef.current)

      return () => observer.disconnect()
    }, [])

    const contextValue: FoundationContextProps | undefined = useMemo(
      () =>
        toSvgBasis !== undefined && toUserBasis !== undefined
          ? {
              userBasis,
              toSvgBasis,
              toUserBasis,
            }
          : undefined,
      [userBasis, toSvgBasis, toUserBasis]
    )

    const containerClassName = `${className} ${clickThrough ? 'clickthrough' : ''}`

    /**
     * Render SVG drawing area.
     */
    return (
      <>
        <style>{`.clickthrough { pointer-events: none; &>svg>* { pointer-events: initial; } }`}</style>
        <div
          ref={callbackRef}
          className={containerClassName}
          {...externalProps}
        >
          <svg width={width} height={height}>
            {contextValue !== undefined ? (
              <FoundationContext.Provider value={contextValue}>
                {children}
              </FoundationContext.Provider>
            ) : null}
          </svg>
        </div>
      </>
    )
  }
)

Foundation.displayName = 'Foundation'
