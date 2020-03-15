import React, { useMemo } from 'react'
import styled from 'styled-components'
import { VapixParameters } from './PlaybackArea'

const StatsWrapper = styled.div`
  width: 400px;
  height: 150px;
  background: rgb(0, 0, 0, 0.66);
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 16px;
  font-family: sans-serif;
  max-width: 80%;
  max-height: 80%;
`

const StatsHeader = styled.div`
  color: white;
  text-align: left;
  font-size: 14px;
  font-weight: bold;
`

const StatContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: left;
`

const Stat = styled.div`
  color: white;
  text-align: left;
  margin: 8px 0;
  width: 45%;
  font-size: 12px;
`

const Bold = styled.span`
  font-weight: bold;
`

interface StatsProps {
  api: string
  parameters: VapixParameters
  host: string
  open: boolean
  refresh: number
}

export const Stats: React.FC<StatsProps> = ({
  api,
  parameters,
  host,
  open,
  refresh,
}) => {
  const streamType = useMemo(() => {
    if (api === 'jpg') {
      return 'Still image'
    }

    if (api === 'media') {
      if (parameters['videocodec'] === 'h264') {
        return 'H264 over RTP'
      }
      return 'MJPG over RTP'
    }

    return 'Unknown'
  }, [api, parameters])

  return (
    <>
      {open ? (
        <StatsWrapper>
          <StatsHeader>Stream statistics:</StatsHeader>
          <StatContainer>
            <Stat>
              <Bold>Host:</Bold> {host}
            </Stat>
            <Stat>
              <Bold>Type:</Bold> {streamType}
            </Stat>
            <Stat>
              <Bold>Size:</Bold> {parameters['resolution'] ?? 'Unknown'}
            </Stat>
            <Stat>
              <Bold>Refreshes:</Bold> {refresh}
            </Stat>
          </StatContainer>
        </StatsWrapper>
      ) : null}
    </>
  )
}
