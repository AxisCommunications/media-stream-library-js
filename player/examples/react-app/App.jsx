import React, { useState, useCallback } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

import { SingleStream } from './SingleStream'
import { BasicStream } from './BasicStream'
import { MultiStream } from './MultiStream'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: sans-serif;
  }
`

const ButtonContainer = styled.div`
  margin: 8px;
  text-align: center;
`

const Button = styled.button`
  padding: 8px 12px;
  margin: 4px;
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
      <GlobalStyle />
      <ButtonContainer>
        <Button onClick={single}>Single stream example</Button>
        <Button onClick={basic}>Basic stream example</Button>
        <Button onClick={multi}>Multi stream example</Button>
      </ButtonContainer>
      {state === 'single' ? <SingleStream /> : null}
      {state === 'basic' ? <BasicStream /> : null}
      {state === 'multi' ? <MultiStream /> : null}
    </>
  )
}
