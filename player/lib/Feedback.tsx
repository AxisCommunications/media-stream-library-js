import React from 'react'
import styled from 'styled-components'

import { Spinner } from './img'

const FeedbackArea = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

interface FeedbackProps {
  readonly waiting?: boolean
}

export const Feedback: React.FC<FeedbackProps> = ({ waiting = false }) => (
  <FeedbackArea>{waiting && <Spinner />}</FeedbackArea>
)
