import React, {
  ChangeEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import styled from 'styled-components'

import {
  AXIS_IMAGE_CGI,
  AXIS_MEDIA_AMP,
  VapixParameters,
  Format,
} from './PlaybackArea'
import { Switch } from './components/Switch'

const SettingsMenu = styled.div`
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 32px;
  right: 0;
  background: rgb(0, 0, 0, 0.66);
  padding: 8px 16px;
  margin-bottom: 16px;
  margin-right: 8px;

  &:after {
    content: '';
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
    position: absolute;
    bottom: -5px;
    right: 12px;
    background: rgb(0, 0, 0, 0.66);
  }
`

const SettingsItem = styled.div`
  display: flex;
  flex-direction: row;
  color: white;
  height: 24px;
  width: 320px;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0;
`

interface SettingsProps {
  readonly parameters: VapixParameters
  readonly api: string
  readonly onFormat: (format: Format) => void
  readonly onVapix: (key: string, value: string) => void
  readonly showStatsOverlay: boolean
  readonly toggleStats: (newValue?: boolean) => void
}

export const Settings: React.FC<SettingsProps> = ({
  parameters,
  api,
  onFormat,
  onVapix,
  showStatsOverlay,
  toggleStats,
}) => {
  const [textString, setTextString] = useState(parameters['textstring'])
  const [videoCodec] = useState(parameters['videocodec'])
  const textStringTimeout = useRef<number>()

  const changeParam: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const { name, value } = e.target

      switch (name) {
        case 'textstring':
          setTextString(value)

          clearTimeout(textStringTimeout.current)
          textStringTimeout.current = window.setTimeout(() => {
            onVapix(name, value)
          }, 300)

          break

        case 'text':
          onVapix(name, value ? '1' : '0')
          break
        default:
          console.warn('internal error')
      }
    },
    [onVapix],
  )

  const changeStatsOverlay: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => toggleStats(e.target.checked),
    [toggleStats],
  )

  const changeFormat: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => onFormat(e.target.value as Format),
    [onFormat],
  )

  const changeResolution: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => onVapix('resolution', e.target.value),
    [onVapix],
  )

  const changeRotation: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => onVapix('rotation', e.target.value),
    [onVapix],
  )

  const changeCompression: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => onVapix('compression', e.target.value),
    [onVapix],
  )

  const determinedFormat = useMemo(() => {
    if (api === AXIS_IMAGE_CGI) {
      return 'JPEG'
    }

    if (api === AXIS_MEDIA_AMP) {
      return videoCodec === 'h264' ? 'H264' : 'MJPEG'
    }
  }, [api, videoCodec])

  return (
    <SettingsMenu>
      <SettingsItem>
        <div>Format</div>
        <select onChange={changeFormat} defaultValue={determinedFormat}>
          <option value="H264">H.264 over RTP</option>
          <option value="MJPEG">JPEG over RTP</option>
          <option value="JPEG">Still image</option>
        </select>
      </SettingsItem>
      <SettingsItem>
        <div>Resolution</div>
        <select value={parameters['resolution']} onChange={changeResolution}>
          <option value="">default</option>
          <option value="1920x1080">1920 x 1080 (FHD)</option>
          <option value="1280x720">1280 x 720 (HD)</option>
          <option value="800x600">800 x 600 (VGA)</option>
        </select>
      </SettingsItem>
      <SettingsItem>
        <div>Rotation</div>
        <select value={parameters['rotation']} onChange={changeRotation}>
          <option value="0">0</option>
          <option value="90">90</option>
          <option value="180">180</option>
          <option value="270">270</option>
        </select>
      </SettingsItem>
      <SettingsItem>
        <div>Compression</div>
        <select value={parameters['compression']} onChange={changeCompression}>
          <option value="">default</option>
          <option value="0">0</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="40">40</option>
          <option value="50">50</option>
          <option value="60">60</option>
          <option value="70">70</option>
          <option value="80">80</option>
          <option value="90">90</option>
          <option value="100">100</option>
        </select>
      </SettingsItem>
      <SettingsItem>
        <div>Text overlay</div>
        <input name="textstring" value={textString} onChange={changeParam} />
        <Switch
          name="text"
          checked={parameters['text'] === '1'}
          onChange={changeParam}
        />
      </SettingsItem>
      <SettingsItem>
        <div>Stats overlay</div>
        <Switch checked={showStatsOverlay} onChange={changeStatsOverlay} />
      </SettingsItem>
    </SettingsMenu>
  )
}
