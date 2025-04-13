import React from 'react'

import { Spinner } from './components'

interface FeedbackProps {
  readonly waiting?: boolean
}

export const Feedback: React.FC<FeedbackProps> = ({ waiting = false }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    {waiting && <Spinner />}
  </div>
)
