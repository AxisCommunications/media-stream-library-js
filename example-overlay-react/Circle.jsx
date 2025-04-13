import React, {
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  FoundationContext,
  LinerContext,
  useDraggable,
} from 'media-stream-library/overlay'

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

export const Circle = forwardRef(
  ({ pos, ...circleProps }, ref) => {
    const { toSvgBasis } = useContext(FoundationContext)

    const [cx, cy] = toSvgBasis(pos)

    return <circle style={{ fill: 'rgb(0.5,0.5,0.5,0.2)', stroke: 'grey' }} cx={cx} cy={cy} ref={ref} {...circleProps} />
  }
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

/*
 * Simple variant of DraggableCircle
 *
 * In this example, the function that is subscribing to
 * the draggable events is calling `setSvgPos` which will
 * trigger a re-render through React's state change mechanism.
 */

export const DraggableCircle = forwardRef(({ pos, onChangePos, ...circleProps }, ref) => {
  const { toSvgBasis, toUserBasis } = useContext(FoundationContext)
  const { clampCoord } = useContext(LinerContext)

  const [svgPos, setSvgPos] = useState(toSvgBasis(pos))
  useEffect(() => {
    setSvgPos(toSvgBasis(pos))
  }, [pos, toSvgBasis])

  const { subscribe, unsubscribe, start: drag } = useDraggable()

  useEffect(() => {
    const [x0, y0] = toSvgBasis(pos)
    const updatePosition = ({ vector: [tx, ty] }, ended) => {
      const newSvgPos = clampCoord([x0 + tx, y0 + ty])
      setSvgPos(newSvgPos)
      if (ended) {
        onChangePos(toUserBasis(newSvgPos))
      }
    }
    subscribe(updatePosition)
    return () => {
      unsubscribe()
    }
  }, [
    clampCoord,
    onChangePos,
    pos,
    subscribe,
    toSvgBasis,
    toUserBasis,
    unsubscribe,
  ])

  const [cx, cy] = svgPos

  return (
    <circle
      style={{ fill: 'rgb(0.5,0.5,0.5,0.2)', stroke: 'grey' }}
      name="circle"
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

export const FastDraggableCircle = ({
  pos,
  onChangePos,
  ...circleProps
}) => {
  const { toSvgBasis, toUserBasis } = useContext(FoundationContext)
  const { clampCoord } = useContext(LinerContext)

  const { subscribe, unsubscribe, start: startDragging } = useDraggable()
  const circleRef = useRef(null)

  useEffect(() => {
    const circleEl = circleRef.current
    if (circleEl !== null) {
      const [x0, y0] = toSvgBasis(pos)
      const updatePosition = (
        { vector: [tx, ty] },
        ended
      ) => {
        const newSvgPos = clampCoord([x0 + tx, y0 + ty])
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
  }, [
    clampCoord,
    onChangePos,
    pos,
    subscribe,
    toSvgBasis,
    toUserBasis,
    unsubscribe,
  ])

  const [cx, cy] = toSvgBasis(pos)

  return (
    <circle
      style={{ fill: 'rgb(0.5,0.5,0.5,0.2)', stroke: 'grey' }}
      ref={circleRef}
      name="circle"
      cx={cx}
      cy={cy}
      onPointerDown={startDragging}
      {...circleProps}
    />
  )
}
