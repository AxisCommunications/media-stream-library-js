import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { useInterval } from 'react-hooks-shareable'

import { VapixParameters, VideoProperties } from './PlaybackArea'
import { StreamStats } from './img'

const StatsWrapper = styled.div`
  position: absolute;
  top: 24px;
  left: 24px;
  width: 360px;
  min-width: 240px;
  max-width: 80%;
  max-height: 80%;
  border-radius: 4px;
  background: #292929 0% 0% no-repeat padding-box;
  opacity: 0.88;
`

const StatsHeader = styled.div`
  padding: 8px 24px;
  border-bottom: 1px solid #525252;
`

const StatsIcon = styled.span<{ readonly clickable: boolean }>`
  width: 24px;
  height: 24px;
  float: left;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};

  & > svg {
    fill: #e0e0e0;
  }
`

const StatsTitle = styled.span`
  display: inline-block;
  margin-left: 8px;
  vertical-align: sub;
  text-align: left;
  font-size: 16px;
  font-family: 'Open Sans', Sans-Serif;
  line-height: 22px;
  color: #f5f5f5;
`

const StatsHide = styled.span`
  float: right;
  text-align: right;
`

const HideLink = styled.a`
  vertical-align: sub;
  text-decoration: none;
  font-size: 16px;
  font-family: 'Open Sans', Sans-Serif;
  line-height: 22px;
  color: #b8b8b8;
`

const Data = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 24px;
  row-gap: 16px;
  width: 100%;
  padding: 16px 24px 24px;
`

const StatItem = styled.div`
  text-align: left;
  font-family: 'Open Sans', Sans-Serif;
`

const StatName = styled.div`
  font-size: 12px;
  line-height: 17px;
  color: #b8b8b8;
`

const StatValue = styled.div`
  font-size: 13px;
  line-height: 18px;
  color: #e0e0e0;
`

const StatsShow = styled.div`
  position: absolute;
  top: 24px;
  left: 24px;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  background: #292929 0% 0% no-repeat padding-box;
  opacity: 0.88;
`

interface StatsProps {
  readonly api: string
  readonly parameters: VapixParameters
  readonly videoProperties: VideoProperties
  readonly refresh: number
  readonly volume?: number
}

interface Stat {
  readonly name: string
  readonly value: string | number
  readonly unit?: string
}

const StatsData: React.FC<StatsProps> = ({
  api,
  parameters,
  videoProperties,
  refresh,
  volume,
}) => {
  const [stats, setStats] = useState<Array<Stat>>([])

  // Updates stat values
  const updateValues = useCallback(() => {
    let streamType = 'Unknown'
    if (api === 'jpg') {
      streamType = 'Still image'
    } else if (api === 'media') {
      if (parameters['videocodec'] === 'h264') {
        streamType = 'RTSP (WebSocket)'
      } else {
        streamType = 'MJPEG'
      }
    }
    const { width, height, pipeline } = videoProperties
    let statsData: Array<Stat> = [
      {
        name: 'Stream type',
        value: streamType,
      },
      {
        name: 'Resolution',
        value: `${width}x${height}`,
      },
      {
        name: 'Refreshed',
        value: refresh,
        unit: refresh > 1 ? 'times' : 'time',
      },
    ]
    if (pipeline !== null && pipeline !== undefined) {
      const tracks = pipeline.tracks?.map((track, index) =>
        Object.assign({ index }, track),
      )
      const videoTrack = tracks?.find((track) => track.type === 'video')
      if (videoTrack !== undefined) {
        const { coding, profile, level } = videoTrack?.codec
        const framerate = Number(
          pipeline.framerate[videoTrack.index].toFixed(2),
        )
        const bitrate = Math.round(pipeline.bitrate[videoTrack.index] / 1000)

        statsData = statsData.concat([
          {
            name: 'Encoding',
            value: `${coding} ${profile} (${level})`,
          },
          {
            name: 'Frame rate',
            value: framerate,
            unit: 'fps',
          },
          {
            name: 'Bitrate',
            value: bitrate,
            unit: 'kbit/s',
          },
        ])
      }
    }

    if (volume !== undefined) {
      statsData.push({
        name: 'Volume',
        value: Math.floor(volume * 100),
        unit: '%',
      })
    }

    setStats(statsData)
  }, [api, parameters, refresh, videoProperties, volume])

  useEffect(() => {
    updateValues()
  }, [updateValues])

  useInterval(updateValues, 1000)

  return (
    <Data>
      {stats.length > 0
        ? stats.map((stat) => {
            return (
              <StatItem key={stat.name}>
                <StatName>{stat.name}</StatName>
                <StatValue>{`${stat.value} ${
                  stat.unit !== undefined ? stat.unit : ''
                }`}</StatValue>
              </StatItem>
            )
          })
        : null}
    </Data>
  )
}

export const Stats: React.FC<StatsProps> = ({
  api,
  parameters,
  videoProperties,
  refresh,
  volume,
}) => {
  const [showStats, setShowStats] = useState(true)

  // Handles show/hide stats
  const onToggleStats = useCallback(
    (e) => {
      e.preventDefault()
      setShowStats((prevState) => !prevState)
    },
    [setShowStats],
  )

  return (
    <>
      {showStats ? (
        <StatsWrapper>
          <StatsHeader>
            <StatsIcon clickable={false}>
              <StreamStats />
            </StatsIcon>
            <StatsTitle>Client stream data</StatsTitle>
            <StatsHide>
              <HideLink href="" onClick={onToggleStats}>
                Hide
              </HideLink>
            </StatsHide>
          </StatsHeader>
          <StatsData
            api={api}
            parameters={parameters}
            videoProperties={videoProperties}
            refresh={refresh}
            volume={volume}
          />
        </StatsWrapper>
      ) : (
        <StatsShow>
          <StatsIcon onClick={onToggleStats} clickable={true}>
            <StreamStats title="Show client stream data" />
          </StatsIcon>
        </StatsShow>
      )}
    </>
  )
}
