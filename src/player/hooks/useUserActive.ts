import { RefObject, useEffect, useState } from 'react'

const DEFAULT_TIMEOUT = 3000

/**
 * Listen to activity on an element by the user.
 *
 * @param {Object} ref A React ref for the element
 * @param {Number} duration The duration of inactivity
 * @return {Boolean} The current user activity state
 */
export const useUserActive = (
  ref: RefObject<HTMLElement | null>,
  duration: number = DEFAULT_TIMEOUT
): boolean => {
  const [userActive, setUserActive] = useState(false)
  const startUserActive = () => setUserActive(true)
  const stopUserActive = () => setUserActive(false)

  useEffect(() => {
    if (userActive) {
      const timer = setTimeout(stopUserActive, duration)
      return () => {
        clearTimeout(timer)
      }
    }
  })

  useEffect(() => {
    const el = ref.current

    if (el === null) {
      return
    }

    el.addEventListener('pointermove', startUserActive)
    if (userActive) {
      el.addEventListener('pointerleave', stopUserActive)
    }

    return () => {
      el.removeEventListener('pointermove', startUserActive)
      if (userActive) {
        el.removeEventListener('pointerleave', stopUserActive)
      }
    }
  }, [userActive, ref])

  return userActive
}
