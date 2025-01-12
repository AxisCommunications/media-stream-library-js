import React, { useEffect, useState } from 'react'

import { Player } from 'media-stream-library/player'

// Force a login by fetching usergroup
const authorize = async () => {
  try {
    await window.fetch('/axis-cgi/usergroup.cgi', {
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

export const SingleStream = () => {
  const [authorized, setAuthorized] = useState(false)

  let vapixParams = {}
  try {
    vapixParams = JSON.parse(window.localStorage.getItem('vapix')) ?? {}
  } catch (err) {
    console.warn('no stored VAPIX parameters: ', err)
  }

  useEffect(() => {
    authorize()
      .then(() => setAuthorized(true))
      .catch((err) => {
        console.error(err)
      })
  }, [])

  if (!authorized) {
    return <div>authenticating...</div>
  }

  return (
    <Player
      hostname={window.location.host}
      initialFormat="RTP_H264"
      autoPlay
      autoRetry
      vapixParams={vapixParams}
    />
  )
}
