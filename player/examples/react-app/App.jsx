import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

import { Player } from 'media-stream-player'

const AppContainer = styled.div`
  text-align: center;
`

const HostnameContainer = styled.div`
  align-items: center;
  display: inline-grid;
  grid-gap: 10px;
  grid-template-columns: auto 1fr;
  padding: 10px 0;
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

  useEffect(() => {
    if (!state.authorized) {
      authorize(state.hostname).then(() => {
        setState({ ...state, authorized: true })
      })
    }
  }, [state.authorized, state.hostname])

  return (
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
      </HostnameContainer>
      {state.authorized ? (
        <Player
          hostname={state.hostname}
          format="H264"
          autoPlay
          vapixParams={vapixParams}
        />
      ) : (
        <div>Not authorized</div>
      )}
    </AppContainer>
  )
}
