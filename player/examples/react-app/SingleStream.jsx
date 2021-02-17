import React, { useState, useEffect } from 'react'

import { fetchTransformationMatrix, Player } from 'media-stream-player'

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
    authorize().then(() => {
      fetchTransformationMatrix('metadata').then((t) => {
        console.log('metadata transform = ', t)
      }).catch((err) => {
        console.error('Failed to fetch metadata transform: ', err.message)
      })
      setAuthorized(true)
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
      vapixParams={vapixParams}
    />
  )
}
