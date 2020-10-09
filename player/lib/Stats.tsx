import React, { useMemo } from 'react'
import styled from 'styled-components'
import { VapixParameters, VideoProperties } from './PlaybackArea'

const StatsWrapper = styled.div`
  background: rgb(0, 0, 0, 0.66);
  position: absolute;
  top: 24px;
  left: 24px;
  padding: 8px 16px;
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
  margin: 8px 0 0;
  width: 45%;
  font-size: 12px;
`

const Title = styled.div`
  font-weight: bold;
`

interface StatsProps {
  readonly api: string
  readonly parameters: VapixParameters
  readonly videoProperties: VideoProperties
  readonly host: string
  readonly open: boolean
  readonly refresh: number
}

export const Stats: React.FC<StatsProps> = ({
  api,
  parameters,
  videoProperties,
  host,
  refresh,
}) => {
  const streamType = useMemo(() => {
    if (api === 'jpg') {
      return 'Still image'
    }

    if (api === 'media') {
      if (parameters['videocodec'] === 'h264') {
        return 'H.264'
      }
      return 'Motion JPEG'
    }

    return 'Unknown'
  }, [api, parameters])

  const resolution = useMemo(() => {
    const { width, height } = videoProperties
    return `${width}x${height}`
  }, [videoProperties])

  return (
    <StatsWrapper>
      <StatsHeader>Stream statistics</StatsHeader>
      <StatContainer>
        <Stat>
          <Title>Host</Title>
          <div> {host}</div>
        </Stat>
        <Stat>
          <Title>Format</Title>
          <div> {streamType}</div>
        </Stat>
        <Stat>
          <Title>Resolution</Title>
          <div> {resolution}</div>
        </Stat>
        <Stat>
          <Title>Refreshes</Title>
          <div> {refresh}</div>
        </Stat>
      </StatContainer>
    </StatsWrapper>
  )
}
