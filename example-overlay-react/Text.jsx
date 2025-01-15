import React, { useContext, useEffect, useRef } from 'react'


import {
  FoundationContext,
  LinerContext,
  useDraggable,
} from 'media-stream-library/overlay'

export const Text = ({
  x: userX,
  y: userY,
  onChangePos,
  children,
  ...props
}) => {
  const { toSvgBasis, toUserBasis } = useContext(FoundationContext)
  const { clampBBox } = useContext(LinerContext)

  const { subscribe, unsubscribe, start: startDragging } = useDraggable()
  const textRef = useRef(null)

  useEffect(() => {
    const textEl = textRef.current
    if (textEl === null) {
      return
    }

    // Note: this doesn't work correctly since the bottom of the bounding
    // box does not match the origin of the baseline of the text, but it
    // works reliably enough to limit the text box within the Liner.
    const { x: x0, y: y0 } = textEl.getBBox()
    const updatePosition = ({ vector: [tx, ty] }, ended) => {
      const { width, height } = textEl.getBBox()
      const newBBox = clampBBox({ x: x0 + tx, y: y0 + ty, width, height })
      const newSvgPos = [newBBox.x, newBBox.y + height]
      textEl.setAttribute('x', String(newSvgPos[0]))
      textEl.setAttribute('y', String(newSvgPos[1]))
      if (ended) {
        onChangePos(toUserBasis(newSvgPos))
      }
    }
    subscribe(updatePosition)
    return () => {
      unsubscribe()
    }
  }, [
    userX,
    userY,
    toUserBasis,
    subscribe,
    clampBBox,
    onChangePos,
    unsubscribe,
  ])

  const [x, y] = toSvgBasis([userX, userY])

  return (
    <text style={{ userSelect: 'none' }}
      name="text"
      ref={textRef}
      x={x}
      y={y}
      {...props}
      onPointerDown={startDragging}
    >
      {children}
    </text>
  )
}
