import React, { useCallback, useEffect, useState } from 'react'

import { HttpMp4Pipeline, RtspJpegPipeline, RtspMp4Pipeline } from '../streams'

import { PlayerPipeline, VideoProperties } from './PlaybackArea'
import { Format } from './types'

function isRtspMp4Pipeline(
  pipeline: PlayerPipeline
): pipeline is RtspMp4Pipeline {
  return 'mp4' in pipeline
}

function isRtspJpegPipeline(
  pipeline: PlayerPipeline
): pipeline is RtspJpegPipeline {
  return 'canvas' in pipeline
}

function isHttpMp4Pipeline(
  pipeline: PlayerPipeline
): pipeline is HttpMp4Pipeline {
  return 'mediaElement' in pipeline
}

interface StatsProps {
  readonly format: Format
  readonly videoProperties: VideoProperties
  readonly refresh: number
  readonly volume?: number
}

const streamLabel: Record<Format, string> = {
  [Format.JPEG]: 'HTTP',
  [Format.MJPEG]: 'HTTP',
  [Format.RTP_H264]: 'WebSocket+RTSP',
  [Format.RTP_JPEG]: 'WebSocket+RTSP',
  [Format.MP4_H264]: 'HTTP',
}

const volumeLabel = (volume?: number) => {
  if (volume === undefined) {
    return ''
  }
  const volumeLevel = Math.floor(volume * 100)
  return `🕪 ${volumeLevel}%`
}

const bufferLabel = (el: HTMLVideoElement) => {
  if (el.buffered.length === 0) {
    return 'buffer: -'
  }
  const buffer = Math.floor(
    (el.buffered.end(el.buffered.length - 1) - el.currentTime) * 1000
  )
  return `buffer: ${String(buffer).padStart(5)} ms`
}

export function Stats({
  format,
  videoProperties,
  refresh,
  volume,
}: StatsProps) {
  const [labels, setLabels] = useState<string[]>()
  const update = useCallback(
    (pipeline: PlayerPipeline) => {
      if (isRtspMp4Pipeline(pipeline)) {
        setLabels([
          ...pipeline.mp4.tracks.map(({ name, codec, bitrate, framerate }) => {
            return `${name} (${codec}) @ ${framerate.toFixed(2)} fps, ${(bitrate / 1000).toFixed(1).padStart(6)} kbit/s`
          }),
          bufferLabel(pipeline.videoEl),
        ])
      }
      if (isRtspJpegPipeline(pipeline)) {
        const { framerate, bitrate } = pipeline
        setLabels([
          `JPEG @ ${framerate.toFixed(2)} fps, ${(bitrate / 1000).toFixed(1).padStart(6)} kbit/s`,
        ])
      }
      if (isHttpMp4Pipeline(pipeline)) {
        const { bitrate } = pipeline
        setLabels([
          `${videoProperties.mime ?? 'video/mp4'} @ ${(bitrate / 1000).toFixed(1).padStart(6)} kbit/s (avg)`,
          bufferLabel(pipeline.mediaElement),
        ])
      }
    },
    [videoProperties]
  )

  useEffect(() => {
    const { pipeline } = videoProperties
    if (pipeline) {
      const refresh = setInterval(() => update(pipeline), 1000)
      return () => {
        clearInterval(refresh)
        setLabels([])
      }
    }
  }, [update, videoProperties.pipeline])

  const { width, height } = videoProperties

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        padding: '2px',
        fontSize: '10px',
        background: 'rgba(0,80,0,0.75)',
        color: 'yellow',
        fontFamily: 'mono',
      }}
    >
      <pre
        style={{ margin: 0 }}
      >{`${streamLabel[format]} ${width}x${height} ${volumeLabel(volume)}, refreshed ${refresh}x`}</pre>
      {labels?.map((label, i) => (
        <pre style={{ margin: 0 }} key={i}>
          {label}
        </pre>
      ))}
    </div>
  )
}
