import React, { useEffect, useState } from 'react'

import { Player } from 'media-stream-library/player'

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
      {state.length > 0 ? (
        state.map((device) => {
          return device.authorized ? (
            <div style={{ width: '400px', height: '300px', margin: '8px', }} key={device.hostname}>
              <div style={{ textAlign: 'center' }}>{device.hostname}</div>
              <Player
                style={{ maxWidth: '400px', maxHeight: '300px', margin: '8px', }}
                hostname={device.hostname}
                initialFormat="JPEG"
                autoPlay
                autoRetry
                vapixParams={{ resolution: '800x600' }}
              />
            </div>
          ) : (
            <div style={{ width: '400px', height: '300px', margin: '8px', }} key={device.hostname}>
              <Centered>{device.hostname}</Centered>
              <Centered>Not authorized</Centered>
            </div>
          )
        })
      ) : (
        <div>No authorized devices</div>
      )}
    </>
  )
}
