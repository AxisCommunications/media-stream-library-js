import React, { useState, useRef, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { DateTime, Duration } from 'luxon'

import { useUserActive } from './hooks/useUserActive'

import { Button } from './components/Button'
import { Play, Pause, Stop, Refresh, CogWheel, Screenshot } from './img'
import { Settings } from './Settings'
import { VapixParameters, Format, VideoProperties } from './PlaybackArea'

function isHTMLMediaElement(el: HTMLElement): el is HTMLMediaElement {
  return (el as HTMLMediaElement).buffered !== undefined
}

export const ControlArea = styled.div<{ readonly visible: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
`

export const ControlBar = styled.div`
  width: 100%;
  height: 32px;
  background: rgb(0, 0, 0, 0.66);
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
`

const VolumeContainer = styled.div`
  margin-left: 8px;
`

const Progress = styled.div`
  flex-grow: 2;
  padding: 0 32px;
  display: flex;
  align-items: center;
`

const ProgressBarContainer = styled.div`
  margin: 0;
  width: 100%;
  height: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const ProgressBar = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  height: 1px;
  position: relative;
  width: 100%;

  ${ProgressBarContainer}:hover > & {
    height: 3px;
  }
`

const ProgressBarPlayed = styled.div.attrs<{ readonly fraction: number }>(
  ({ fraction }) => {
    return {
      style: { transform: `scaleX(${fraction})` },
    }
  },
)<{ readonly fraction: number }>`
  background-color: rgb(240, 180, 0);
  height: 100%;
  position: absolute;
  top: 0;
  transform: scaleX(0);
  transform-origin: 0 0;
  width: 100%;
`

const ProgressBarBuffered = styled.div.attrs<{ readonly fraction: number }>(
  ({ fraction }) => {
    return {
      style: { transform: `scaleX(${fraction})` },
    }
  },
)<{ readonly fraction: number }>`
  background-color: rgba(255, 255, 255, 0.2);
  height: 100%;
  position: absolute;
  top: 0;
  transform: scaleX(0);
  transform-origin: 0 0;
  width: 100%;
`

const ProgressTimestamp = styled.div.attrs<{ readonly left: number }>(
  ({ left }) => {
    return {
      style: { left: `${left}px` },
    }
  },
)<{ readonly left: number }>`
  background-color: rgb(56, 55, 51);
  border-radius: 3px;
  bottom: 200%;
  color: #fff;
  font-size: 9px;
  padding: 5px;
  position: absolute;
  text-align: center;
`

const ProgressIndicator = styled.div`
  color: rgb(240, 180, 0);
  padding-left: 24px;
  font-size: 10px;
  white-space: nowrap;
`

interface ControlsProps {
  readonly play?: boolean
  readonly videoProperties?: VideoProperties
  readonly startTime?: string // 2021-02-03T12:21:57.465715Z
  readonly duration?: number
  readonly src?: string
  readonly parameters: VapixParameters
  readonly onPlay: () => void
  readonly onStop: () => void
  readonly onRefresh: () => void
  readonly onSeek: (offset: number) => void
  readonly onScreenshot: () => void
  readonly onFormat: (format: Format) => void
  readonly onVapix: (key: string, value: string) => void
  readonly labels?: {
    readonly play?: string
    readonly pause?: string
    readonly stop?: string
    readonly refresh?: string
    readonly screenshot?: string
    readonly settings?: string
    readonly volume?: string
  }
  readonly showStatsOverlay: boolean
  readonly toggleStats: () => void
  readonly format: Format
  readonly volume?: number
  readonly setVolume?: (v: number) => void
}

export const Controls: React.FC<ControlsProps> = ({
  play,
  videoProperties,
  duration,
  startTime,
  src,
  parameters,
  onPlay,
  onStop,
  onRefresh,
  onSeek,
  onScreenshot,
  onFormat,
  onVapix,
  labels,
  showStatsOverlay,
  toggleStats,
  format,
  volume,
  setVolume,
}) => {
  const controlArea = useRef(null)
  const userActive = useUserActive(controlArea)

  const [settings, setSettings] = useState(false)
  const toggleSettings = useCallback(
    () => setSettings((currentSettings) => !currentSettings),
    [setSettings],
  )

  const onVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (setVolume !== undefined) {
        setVolume(parseFloat(e.target.value))
      }
    },
    [setVolume],
  )

  const [totalDuration, setTotalDuration] = useState(duration)
  const __mediaTimeline = useRef({
    startDateTime:
      startTime !== undefined ? DateTime.fromISO(startTime) : undefined,
  })

  /**
   * Progress
   *
   * Compute progress of played and buffered amounts of media. This includes any
   * media before the actual start of the video.
   *
   * The range on videoProperties specifies where we started to play (meaning,
   * the time corresponding to currentTime = 0), and where the playback stops.
   * To avoid having to collect extra data about the actual media length, we
   * treat the end of the range as the end of the actual media (i.e. a simple
   * way to establish the duration).
   *
   * Example:
   *  - range = [0, undefined] => start from the beginning, unknown end
   *  - range = [8, 19] => start from 8s into the media, stop at 19s in which
   *    case currentTime = 0 is actually 8s. In this case the media is actually
   *    25s long, but we cannot display that in our progress. So this system
   *    only works correctly when playing back from any starting point till the
   *    end of the media (i.e. no "chunks" within).
   *
   *    media        0 ------------------------------------------------- 25s
   *    range                     8s ----------------------------- 19s
   *    currentTime               0s ----------------------------- 11s
   *    progress     0 ------------------------------------------- 19s
   *
   *  So we treat the start of the range as offset for total progress, and the
   *  end of the range as total duration. That means we do not handle situations
   *  where the duration is longer than the end of the range.
   *
   * When computing progress, if the duration is Infinity (live playback), we
   * use the total buffered time as a (temporary) duration.
   */
  const [progress, setProgress] = useState({
    playedFraction: 0,
    bufferedFraction: 0,
    counter: '',
  })
  useEffect(() => {
    if (videoProperties === undefined) {
      return
    }
    const { el, pipeline, range } = videoProperties
    if (el === null || pipeline === undefined) {
      return
    }

    // Extract range and update duration accordingly.
    const [start = 0, end = duration] = range ?? [0, duration]
    const __duration = duration ?? end ?? Infinity
    setTotalDuration(__duration)

    const updateProgress = () => {
      const played = start + pipeline.currentTime
      const buffered =
        isHTMLMediaElement(el) && el.buffered.length > 0
          ? start + el.buffered.end(el.buffered.length - 1)
          : played
      const total = __duration === Infinity ? buffered : __duration

      const counter = `${Duration.fromMillis(played * 1000).toFormat(
        'h:mm:ss',
      )} / ${Duration.fromMillis(total * 1000).toFormat('h:mm:ss')}`
      setProgress({
        playedFraction: played / total,
        bufferedFraction: buffered / total,
        counter,
      })
    }
    updateProgress()

    // Use progress events on media elements
    if (isHTMLMediaElement(el)) {
      el.addEventListener('ended', updateProgress)
      el.addEventListener('progress', updateProgress)
      el.addEventListener('timeupdate', updateProgress)
      return () => {
        el.removeEventListener('timeupdate', updateProgress)
        el.removeEventListener('progress', updateProgress)
        el.removeEventListener('ended', updateProgress)
      }
    }

    // Use polling when not a media element
    const progressInterval = setInterval(updateProgress, 1000)
    return () => {
      clearInterval(progressInterval)
    }
  }, [videoProperties, duration, startTime, setTotalDuration])

  const seek = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (totalDuration === undefined) {
        return
      }

      const { left, width } = e.currentTarget.getBoundingClientRect()
      const fraction = (e.pageX - left) / width

      onSeek(fraction * totalDuration)
    },
    [totalDuration, onSeek],
  )

  const [timestamp, setTimestamp] = useState({ left: 0, label: '' })
  const __progressBarContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (startTime !== undefined) {
      __mediaTimeline.current.startDateTime = DateTime.fromISO(startTime)
    }

    const el = __progressBarContainerRef.current
    if (el === null || totalDuration === undefined) {
      return
    }

    const { left, width } = el.getBoundingClientRect()
    const showTimestamp = (e: Event) => {
      const offset = (e as PointerEvent).pageX - left
      const offsetMillis = (offset / width) * totalDuration * 1000

      setTimestamp({
        left: offset,
        label:
          __mediaTimeline.current.startDateTime !== undefined
            ? __mediaTimeline.current.startDateTime
                .plus(offsetMillis)
                .toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)
            : Duration.fromMillis(offsetMillis).toFormat('h:mm:ss'),
      })
    }

    const start = () => {
      el.addEventListener('pointermove', showTimestamp)
    }
    const stop = () => {
      setTimestamp({ left: 0, label: '' })
      el.removeEventListener('pointermove', showTimestamp)
    }

    el.addEventListener('pointerover', start)
    el.addEventListener('pointerout', stop)
    return () => {
      el.removeEventListener('pointerout', stop)
      el.removeEventListener('pointerover', start)
    }
  }, [startTime, totalDuration])

  return (
    <ControlArea
      ref={controlArea}
      visible={play !== true || settings || userActive}
    >
      <ControlBar>
        <Button onClick={onPlay}>
          {play === true ? (
            <Pause title={labels?.pause} />
          ) : (
            <Play title={labels?.play} />
          )}
        </Button>
        {src !== undefined && (
          <Button onClick={onStop}>
            <Stop title={labels?.stop} />
          </Button>
        )}
        {src !== undefined && (
          <Button onClick={onRefresh}>
            <Refresh title={labels?.refresh} />
          </Button>
        )}
        {src !== undefined && (
          <Button onClick={onScreenshot}>
            <Screenshot title={labels?.screenshot} />
          </Button>
        )}
        {volume !== undefined ? (
          <VolumeContainer title={labels?.volume}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              onChange={onVolumeChange}
              value={volume ?? 0}
            />
          </VolumeContainer>
        ) : null}
        <Progress>
          <ProgressBarContainer onClick={seek} ref={__progressBarContainerRef}>
            <ProgressBar>
              <ProgressBarPlayed fraction={progress.playedFraction} />
              <ProgressBarBuffered fraction={progress.bufferedFraction} />
              {timestamp.left !== 0 ? (
                <ProgressTimestamp left={timestamp.left}>
                  {timestamp.label}
                </ProgressTimestamp>
              ) : null}
            </ProgressBar>
          </ProgressBarContainer>
          <ProgressIndicator>
            {totalDuration === Infinity ? '∙ LIVE' : progress.counter}
          </ProgressIndicator>
        </Progress>
        <Button onClick={toggleSettings}>
          <CogWheel title={labels?.settings} />
        </Button>
      </ControlBar>
      {settings && (
        <Settings
          parameters={parameters}
          format={format}
          onFormat={onFormat}
          onVapix={onVapix}
          showStatsOverlay={showStatsOverlay}
          toggleStats={toggleStats}
        />
      )}
    </ControlArea>
  )
}
