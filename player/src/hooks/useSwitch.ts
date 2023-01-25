import { useCallback, useState } from 'react'

export const useSwitch = (
  initialValue = false
): readonly [boolean, (state?: boolean) => void] => {
  const [value, setValue] = useState(initialValue)

  const toggleValue = useCallback(
    (state?: boolean) => {
      if (state !== undefined) {
        setValue(state)
      } else {
        setValue((oldValue) => !oldValue)
      }
    },
    [setValue]
  )

  return [value, toggleValue]
}
