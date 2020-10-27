import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

import { Player } from 'media-stream-player'

const Title = styled.h1`
  text-align: center;
  margin: 24px auto;
`

const AppContainer = styled.div`
  width: 100vw;
  height: 60vh;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: center;
`
const MediaPlayer = styled(Player)`
  max-width: 400px;
  max-height: 300px;
  margin: 8px;
`

const MediaPlayerContainer = styled.div`
  width: 400px;
  height: 300px;
  margin: 8px;
`

const Centered = styled.div`
  text-align: center;
`

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
    throw err
  }
}

/**
 * Example multi stream application that uses the `Player` component.
 */

const devices = [
  { hostname: '192.168.0.90', authorized: false },
  { hostname: '192.168.0.91', authorized: false },
  { hostname: '192.168.0.92', authorized: false },
  { hostname: '192.168.0.93', authorized: false },
  { hostname: '192.168.0.94', authorized: false },
  { hostname: '192.168.0.95', authorized: false },
]

export const MultiStream = () => {
  const [state, setState] = useState([])

  useEffect(() => {
    devices.forEach(({ hostname }) => {
      authorize(hostname)
        .then(() => {
          setState((prevState) => [
            ...prevState,
            { hostname, authorized: true },
          ])
        })
        .catch(() => {
          setState((prevState) => [
            ...prevState,
            { hostname, authorized: false },
          ])
        })
    })
  }, [])

  return (
    <>
      <Title>multi stream media-stream-player</Title>
      <AppContainer>
        {state.length > 0 ? (
          state.map((device) => {
            return device.authorized ? (
              <MediaPlayerContainer key={device.hostname}>
                <Centered>{device.hostname}</Centered>
                <MediaPlayer
                  hostname={device.hostname}
                  format="JPEG"
                  autoPlay
                  vapixParams={{ resolution: '800x600' }}
                />
              </MediaPlayerContainer>
            ) : (
              <MediaPlayerContainer key={device.hostname}>
                <Centered>{device.hostname}</Centered>
                <Centered>Not authorized</Centered>
              </MediaPlayerContainer>
            )
          })
        ) : (
          <div>No authorized devices</div>
        )}
      </AppContainer>
    </>
  )
}
