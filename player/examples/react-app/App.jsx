import React, { useState, useCallback } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

import { Player } from 'media-stream-player'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
  }
`

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const HostnameContainer = styled.div`
  align-items: center;
  display: inline-grid;
  grid-gap: 10px;
  grid-template-columns: auto 1fr auto;
  padding: 10px 0;
`

const MediaPlayer = styled(Player)`
  width: 100%;
  height: 100%;
`

const DEFAULT_HOSTNAME = '192.168.0.90'

// force auth
const authorize = async (host) => {
  // Force a login by fetching usergroup
  try {
    await window.fetch(`http://${host}/axis-cgi/usergroup.cgi`, {
      credentials: 'include',
      mode: 'no-cors',
    })
  } catch (err) {
    console.error(err)
  }
}

/**
 * Example application that uses the `Player` component.
 */

export const App = () => {
  const [state, setState] = useState({
    authorized: false,
    hostname: localStorage.getItem('hostname') || DEFAULT_HOSTNAME,
  })

  let vapixParams = {}
  try {
    vapixParams = JSON.parse(window.localStorage.getItem('vapix')) ?? {}
  } catch (err) {
    console.warn('no stored VAPIX parameters: ', err)
  }

  const connect = useCallback(() => {
    if (!state.authorized) {
      authorize(state.hostname).then(() => {
        setState({ ...state, authorized: true })
      })
    }
  }, [state.authorized, state.hostname])

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <h1>media-stream-player</h1>
        <HostnameContainer>
          <label htmlFor="hostname">Hostname</label>
          <input
            id="hostname"
            value={state.hostname}
            onChange={({ target: { value } }) => {
              setState({ authorized: false, hostname: value })
              localStorage.setItem('hostname', value)
            }}
          />
          <button onClick={connect}>connect</button>
        </HostnameContainer>
        {state.authorized ? (
          <MediaPlayer
            hostname={state.hostname}
            format="H264"
            autoPlay
            vapixParams={vapixParams}
          />
        ) : (
          <div>Not authorized</div>
        )}
      </AppContainer>
    </>
  )
}
