import React, { useCallback, useState } from 'react'

import { BasicStream } from './BasicStream'
import { MultiStream } from './MultiStream'
import { SingleStream } from './SingleStream'

const style = `
body {
  margin: 0;
  font-family: sans-serif;
}
.appContainer {
  width: 100vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.buttonContainer {
  margin: 8px;
  text-align: center;
  & button {
    padding: 8px 12px;
    margin: 4px;
    background-color: lightpink;
    &.selected {
      background-color: lightgreen;
    }
  }
}
`
const LOCALSTORAGE_KEY = 'media-stream-player-example'

export const App = () => {
  const example = localStorage.getItem(LOCALSTORAGE_KEY)
  const [state, setState] = useState(example || 'single')

  const single = useCallback(() => {
    setState('single')
    localStorage.setItem(LOCALSTORAGE_KEY, 'single')
  }, [setState])

  const basic = useCallback(() => {
    setState('basic')
    localStorage.setItem(LOCALSTORAGE_KEY, 'basic')
  }, [setState])

  const multi = useCallback(() => {
    setState('multi')
    localStorage.setItem(LOCALSTORAGE_KEY, 'multi')
  }, [setState])

  return (
    <>
      <style>{style}</style>
      <div className='appContainer'>
        <h1>Media Stream Player</h1>
        <div className='buttonContainer'>
          <button onClick={single} className={state === 'single' ? 'selected' : undefined}>
            Single stream (with controls)
          </button>
          <button onClick={basic} className={state === 'basic' ? 'selected' : undefined}>
            Single stream (basic)
          </button>
          <button onClick={multi} className={state === 'multi' ? 'selected' : undefined}>
            Multi stream
          </button>
        </div>
        {state === 'single' ? <SingleStream /> : null}
        {state === 'basic' ? <BasicStream /> : null}
        {state === 'multi' ? <MultiStream /> : null}
      </div>
    </>
  )
}
