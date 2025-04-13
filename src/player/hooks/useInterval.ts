import { useEffect, useRef } from 'react'

export const useInterval = (callback: VoidFunction, delay: number) => {
  const savedCallback = useRef<VoidFunction>(undefined)

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    const tick = () => {
      if (savedCallback.current !== undefined) {
        savedCallback.current()
      }
    }

    const id = setInterval(tick, delay)
    return () => clearInterval(id)
  }, [delay])
}
