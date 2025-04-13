import React, { ChangeEventHandler, useCallback, useRef, useState } from 'react'

import { VapixParameters } from './PlaybackArea'
import { Format } from './types'

interface SettingsProps {
  readonly parameters: VapixParameters
  readonly format: Format
  readonly onFormat: (format: Format) => void
  readonly onVapix: (key: string, value: string) => void
  readonly showStatsOverlay: boolean
  readonly toggleStats: (newValue?: boolean) => void
}

export const Settings: React.FC<SettingsProps> = ({
  parameters,
  format,
  onFormat,
  onVapix,
  showStatsOverlay,
  toggleStats,
}) => {
  const [textString, setTextString] = useState(parameters['textstring'])
  const textStringTimeout = useRef<number>(undefined)

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
    [onVapix]
  )

  const changeStatsOverlay: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => toggleStats(e.target.checked),
    [toggleStats]
  )

  const changeFormat: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => onFormat(e.target.value as Format),
    [onFormat]
  )

  const changeResolution: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => onVapix('resolution', e.target.value),
    [onVapix]
  )

  const changeRotation: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => onVapix('rotation', e.target.value),
    [onVapix]
  )

  const changeCompression: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => onVapix('compression', e.target.value),
    [onVapix]
  )

  return (
    <div
      style={{
        background: 'rgb(32, 32, 32, 0.66)',
        bottom: '32px',
        color: 'white',
        display: 'grid',
        fontFamily: 'sans-serif',
        fontSize: '12px',
        gridTemplateColumns: '30% 70%',
        gridTemplateRows: 'auto',
        marginBottom: '16px',
        marginRight: '8px',
        padding: '8px 16px',
        position: 'absolute',
        right: '0',
        rowGap: '4px',
        width: '320px',
      }}
    >
      <div>Format</div>
      <select onChange={changeFormat} defaultValue={format}>
        <option value="RTP_H264">H.264 (RTP over WS)</option>
        <option value="MP4_H264">H.264 (MP4 over HTTP)</option>
        <option value="RTP_JPEG">Motion JPEG</option>
        <option value="JPEG">Still image</option>
      </select>
      <div>Resolution</div>
      <select value={parameters['resolution']} onChange={changeResolution}>
        <option value="">default</option>
        <option value="1920x1080">1920 x 1080 (FHD)</option>
        <option value="1280x720">1280 x 720 (HD)</option>
        <option value="800x600">800 x 600 (VGA)</option>
      </select>
      <div>Rotation</div>
      <select value={parameters['rotation']} onChange={changeRotation}>
        <option value="0">0</option>
        <option value="90">90</option>
        <option value="180">180</option>
        <option value="270">270</option>
      </select>
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
      <div>Text overlay</div>
      <div>
        <input
          style={{ width: 'fit-content' }}
          type="checkbox"
          name="text"
          checked={parameters['text'] === '1'}
          onChange={changeParam}
        />
        <input
          style={{ marginLeft: '8px' }}
          name="textstring"
          value={textString}
          onChange={changeParam}
        />
      </div>
      <div>Stats overlay</div>
      <input
        style={{ width: 'fit-content' }}
        type="checkbox"
        name="text"
        checked={showStatsOverlay}
        onChange={changeStatsOverlay}
      />
    </div>
  )
}
