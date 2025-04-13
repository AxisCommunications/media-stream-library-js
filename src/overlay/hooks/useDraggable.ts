import {
  PointerEventHandler,
  PointerEvent as PointerEventReact,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Coord } from '../utils/geometry'

export interface DraggableEvent {
  readonly name: string | null
  readonly vector: Coord
}

export type DraggableHandler = (e: DraggableEvent, ended: boolean) => void

export interface DraggableControls {
  /**
   * Pointer event handler that signals the start of the drag.
   * Should be assigned to the `onPointerDown` property of the
   * element(s) you want to drag.
   *
   * Note: you should set the `name` attribute on the draggable
   * element(s), to identify the dragged element in the draggable
   * event.
   */
  readonly start: PointerEventHandler<SVGElement>
  /**
   * A function to register a draggable event listener. The
   * draggable event contains the name and translation vector
   * of the dragged element (provided a `name` attribute was
   * set).
   */
  readonly subscribe: (subscriber: DraggableHandler) => void
  /**
   * A function to unregister the draggable event listener.
   */
  readonly unsubscribe: VoidFunction
}

/**
 * useDraggable
 *
 * A hook which provides a convenient way to subscribe to
 * the translation vector when starting to drag an element.
 */
export function useDraggable(): DraggableControls {
  const [origin, setOrigin] = useState<Coord | null>(null)

  const __translationName = useRef<string | null>(null)
  const __translationVector = useRef<Coord>([0, 0])
  const __translationSubscriber = useRef<DraggableHandler>(undefined)

  const subscribe = useCallback((subscriber: DraggableHandler) => {
    __translationSubscriber.current = subscriber
  }, [])

  const unsubscribe = useCallback(() => {
    __translationSubscriber.current = undefined
    __translationName.current === null
    __translationVector.current = [0, 0]
    setOrigin(null)
  }, [])

  const start = useCallback((e: PointerEventReact<SVGElement>) => {
    e.stopPropagation()
    const name = e.currentTarget.getAttribute('name')
    if (name === null) {
      console.error(`${useDraggable.name}: 'name' attribute missing on element`)
    }
    setOrigin([e.pageX, e.pageY])
    __translationName.current = name
  }, [])

  useEffect(() => {
    if (origin !== null) {
      const [originX, originY] = origin
      const emitTranslationEvent = (ended: boolean) => {
        if (__translationSubscriber.current === undefined) {
          console.error(`${useDraggable.name}: 'missing subscriber function'`)
          return
        }
        __translationSubscriber.current(
          {
            name: __translationName.current,
            vector: __translationVector.current,
          },
          ended
        )
      }
      const updateTranslation = (e: PointerEvent) => {
        __translationVector.current = [e.pageX - originX, e.pageY - originY]
        emitTranslationEvent(false)
      }
      const endTranslation = () => {
        setOrigin(null)
        emitTranslationEvent(true)
      }
      document.addEventListener('pointermove', updateTranslation)
      document.addEventListener('pointerup', endTranslation)
      return () => {
        document.removeEventListener('pointermove', updateTranslation)
        document.removeEventListener('pointerup', endTranslation)
      }
    }
  }, [origin])

  return { subscribe, unsubscribe, start }
}
