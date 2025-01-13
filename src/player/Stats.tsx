import React, {
  MouseEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react'
import styled from 'styled-components'

import { RtspMp4Pipeline } from '../streams'

import { PlayerPipeline, VideoProperties } from './PlaybackArea'
import { useInterval } from './hooks/useInterval'
import { StreamStats } from './img'
import { Format } from './types'

const isRtspMp4Pipeline = (
  pipeline: PlayerPipeline | undefined
): pipeline is RtspMp4Pipeline => {
  return (pipeline as RtspMp4Pipeline)?.mp4.tracks !== undefined
}

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
  readonly format: string
  readonly videoProperties: VideoProperties
  readonly refresh: number
  readonly volume?: number
  readonly expanded: boolean
  readonly onToggleExpanded: (value: boolean) => void
}

interface Stat {
  readonly name: string
  readonly value: string | number
  readonly unit?: string
}

const StatsData: React.FC<
  Omit<StatsProps, 'expanded' | 'onToggleExpanded'>
> = ({ format, videoProperties, refresh, volume }) => {
  const [stats, setStats] = useState<Array<Stat>>([])

  // Updates stat values
  const updateValues = useCallback(() => {
    let streamType = 'Unknown'
    if (format === Format.JPEG) {
      streamType = 'Still image'
    } else if (format === Format.MJPEG) {
      streamType = 'MJPEG'
    } else if (format === Format.RTP_H264) {
      streamType = 'RTSP (WebSocket)'
    } else if (format === Format.RTP_JPEG) {
      streamType = 'MJPEG'
    } else if (format === Format.MP4_H264) {
      streamType = 'MP4 (HTTP)'
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
    if (isRtspMp4Pipeline(pipeline)) {
      pipeline.mp4.tracks.forEach(({ id, name, codec, bitrate, framerate }) => {
        statsData = statsData.concat([
          {
            name: `Track ${id}`,
            value: `${name} (${codec})`,
          },
          {
            name: 'Frame rate',
            value: framerate.toFixed(2),
            unit: 'fps',
          },
          {
            name: 'Bitrate',
            value: (bitrate / 1000).toFixed(1),
            unit: 'kbit/s',
          },
        ])
      })
    }

    if (volume !== undefined) {
      statsData.push({
        name: 'Volume',
        value: Math.floor(volume * 100),
        unit: '%',
      })
    }

    setStats(statsData)
  }, [format, refresh, videoProperties, volume])

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
                <StatValue>
                  {`${stat.value} ${stat.unit !== undefined ? stat.unit : ''}`}
                </StatValue>
              </StatItem>
            )
          })
        : null}
    </Data>
  )
}

export const Stats: React.FC<StatsProps> = ({
  format,
  videoProperties,
  refresh,
  volume,
  expanded,
  onToggleExpanded,
}) => {
  // Handles show/hide stats
  const onToggleStats = useCallback<MouseEventHandler<HTMLAnchorElement>>(
    (e) => {
      e.preventDefault()
      onToggleExpanded(!expanded)
    },
    [expanded, onToggleExpanded]
  )

  return (
    <>
      {expanded ? (
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
            format={format}
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
