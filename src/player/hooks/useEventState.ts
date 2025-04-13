import { RefObject, useCallback, useEffect, useState } from 'react'

/**
 * Use a state set by an event:
 *  - default state is false
 *  - when event fired, state is true
 *
 * @param {Object} ref A React ref for the element
 * @param {String} eventName The name of the event setting the state to true
 * @return {Array} The boolean state and a function to switch state to false
 */
export const useEventState = (
  ref: RefObject<HTMLElement | null>,
  eventName: string
): readonly [boolean, () => void] => {
  const [eventState, setEventState] = useState(false)

  const setEventStateTrue = useCallback(() => setEventState(true), [])
  const setEventStateFalse = useCallback(() => setEventState(false), [])

  useEffect(() => {
    const el = ref.current
    if (!eventState && el !== null) {
      el.addEventListener(eventName, setEventStateTrue)

      return () => {
        el.removeEventListener(eventName, setEventStateTrue)
      }
    }
  }, [eventState, eventName, ref, setEventStateTrue])

  return [eventState, setEventStateFalse]
}
