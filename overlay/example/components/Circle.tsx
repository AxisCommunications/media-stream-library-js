import {
  useContext,
  useEffect,
  useState,
  useRef,
  SVGProps,
  FC,
  forwardRef,
} from 'react'
import styled from 'styled-components'

import {
  FoundationContext,
  Coord,
  useDraggable,
  DraggableHandler,
  LinerContext,
} from 'media-overlay-library'

type BaseElement = SVGCircleElement
type BaseProps = Omit<SVGProps<BaseElement>, 'ref'>

const SvgCircle = styled.circle`
  fill: rgb(0.5, 0.5, 0.5, 0.2);
  stroke: grey;
`

/*
 * Circle
 *
 * Renders an SVG <circle> at some specified user coordinate.
 *
 * In this example, the user coordinates are converted to the
 * SVG coordinates by the `toSvgBasis` provided by `Foundation`.
 * This is the most basic thing the library does for you: provide
 * functions to convert from user to SVG coordinates (and back).
 */

interface CircleProps extends BaseProps {
  /**
   * A coordinate pair [x, y] that represents the middle of the circle.
   */
  readonly pos: Coord
}

export const Circle: FC<CircleProps> = forwardRef<BaseElement, CircleProps>(
  ({ pos, ...circleProps }, ref) => {
    const { toSvgBasis } = useContext(FoundationContext)

    const [cx, cy] = toSvgBasis(pos)

    return <SvgCircle cx={cx} cy={cy} ref={ref} {...circleProps} />
  },
)

/*
 * DraggableCircle
 *
 * Renders an SVG <circle> that can be dragged around.
 *
 * Dragging is provided through the `useDraggable` hook,
 * which gives a means of subscribing/unsubscribing to
 * draggable events, and a function to trigger the start
 * of dragging.
 * At the end of dragging, the new coordinates are sent
 * to the parent via the `onChangePos` callback, which
 * will result in an update of the `pos` property.
 */

interface DraggableCircleProps extends BaseProps {
  /**
   * A coordinate pair [x, y] that represents the middle of the circle.
   */
  readonly pos: Coord
  /**
   * Callback with new coordinates when they were changed.
   */
  readonly onChangePos: (pos: Coord) => void
}

/*
 * Simple variant of DraggableCircle
 *
 * In this example, the function that is subscribing to
 * the draggable events is calling `setSvgPos` which will
 * trigger a re-render through React's state change mechanism.
 */

export const DraggableCircle: FC<DraggableCircleProps> = forwardRef<
  BaseElement,
  DraggableCircleProps
>(({ pos, onChangePos, ...circleProps }, ref) => {
  const { toSvgBasis, toUserBasis } = useContext(FoundationContext)
  const { clampCoord } = useContext(LinerContext)

  const [svgPos, setSvgPos] = useState(toSvgBasis(pos))
  useEffect(() => {
    setSvgPos(toSvgBasis(pos))
  }, [pos, toSvgBasis])

  const { subscribe, unsubscribe, start: drag } = useDraggable()

  useEffect(() => {
    const [x0, y0] = toSvgBasis(pos)
    const updatePosition: DraggableHandler = ({ vector: [tx, ty] }, ended) => {
      const newSvgPos: Coord = clampCoord([x0 + tx, y0 + ty])
      setSvgPos(newSvgPos)
      if (ended) {
        onChangePos(toUserBasis(newSvgPos))
      }
    }
    subscribe(updatePosition)
    return () => {
      unsubscribe()
    }
  }, [pos, toSvgBasis, toUserBasis])

  const [cx, cy] = svgPos

  return (
    <SvgCircle
      name={'circle'}
      cx={cx}
      cy={cy}
      onPointerDown={drag}
      ref={ref}
      {...circleProps}
    />
  )
})

/*
 * Optimized variant of DraggableCircle
 *
 * In this example, the function that is subscribing to
 * the draggable events is re-rendering the circle in the DOM
 * directly, without involving React, by using `setAttribute`.
 *
 * This is a more optimized way of dragging, as we avoid any
 * state changes during dragging.
 */

export const FastDraggableCircle: FC<DraggableCircleProps> = ({
  pos,
  onChangePos,
  ...circleProps
}) => {
  const { toSvgBasis, toUserBasis } = useContext(FoundationContext)
  const { clampCoord } = useContext(LinerContext)

  const { subscribe, unsubscribe, start: startDragging } = useDraggable()
  const circleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const circleEl = circleRef.current
    if (circleEl !== null) {
      const [x0, y0] = toSvgBasis(pos)
      const updatePosition: DraggableHandler = (
        { vector: [tx, ty] },
        ended,
      ) => {
        const newSvgPos: Coord = clampCoord([x0 + tx, y0 + ty])
        circleEl.setAttribute('cx', String(newSvgPos[0]))
        circleEl.setAttribute('cy', String(newSvgPos[1]))
        if (ended) {
          onChangePos(toUserBasis(newSvgPos))
        }
      }
      subscribe(updatePosition)
      return () => {
        unsubscribe()
      }
    }
  }, [pos, toSvgBasis, toUserBasis])

  const [cx, cy] = toSvgBasis(pos)

  return (
    <SvgCircle
      ref={circleRef}
      name={'circle'}
      cx={cx}
      cy={cy}
      onPointerDown={startDragging}
      {...circleProps}
    />
  )
}
