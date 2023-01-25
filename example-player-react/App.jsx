import React, { useCallback, useState } from 'react'

import styled, { createGlobalStyle } from 'styled-components'

import { BasicStream } from './BasicStream'
import { MultiStream } from './MultiStream'
import { SingleStream } from './SingleStream'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: sans-serif;
  }
`

const AppContainer = styled.div`
  width: 100vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const ButtonContainer = styled.div`
  margin: 8px;
  text-align: center;
`

const Button = styled.button`
  padding: 8px 12px;
  margin: 4px;
  background-color: ${({ selected }) =>
    selected ? 'lightgreen' : 'lightpink'};
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
    <AppContainer>
      <GlobalStyle />
      <h1>Media Stream Player</h1>
      <ButtonContainer>
        <Button onClick={single} selected={state === 'single'}>
          Single stream (with controls)
        </Button>
        <Button onClick={basic} selected={state === 'basic'}>
          Single stream (basic)
        </Button>
        <Button onClick={multi} selected={state === 'multi'}>
          Multi stream
        </Button>
      </ButtonContainer>
      {state === 'single' ? <SingleStream /> : null}
      {state === 'basic' ? <BasicStream /> : null}
      {state === 'multi' ? <MultiStream /> : null}
    </AppContainer>
  )
}
