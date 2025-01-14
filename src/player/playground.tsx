import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { Player } from './Player'

const appRoot = createRoot(document.querySelector('#root')!)

appRoot.render(
  <React.StrictMode>
    <style>{`body {padding: 0; margin: 0;}`}</style>
    <Playground />
  </React.StrictMode>
)

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

function Playground() {
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    authorize()
      .then(() => setAuthorized(true))
      .catch((err) => {
        console.error('Failed to authenticate: ', err)
      })
  }, [])

  if (!authorized) {
    return <div>authenticating...</div>
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Player hostname={window.location.host} />
    </div>
  )
}
