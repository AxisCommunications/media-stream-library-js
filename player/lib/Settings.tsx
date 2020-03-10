import React, { ChangeEvent, useCallback } from 'react'
import styled from 'styled-components'

import { Format } from './Player'
import { VapixParameters } from './PlaybackArea'

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
  parameters: VapixParameters
  onFormat: (format: Format) => void
  onVapix: (key: string, value: string) => void
}

export const Settings: React.FC<SettingsProps> = ({
  parameters,
  onFormat,
  onVapix,
}) => {
  const changeParam = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    switch (e.target.name) {
      case 'textstring':
        onVapix(e.target.name, e.target.value)
        break
      case 'text':
        onVapix(e.target.name, e.target.checked ? '1' : '0')
        break
      default:
        console.warn('internal error')
    }
  }, [])

  return (
    <SettingsMenu>
      <SettingsItem>
        <div>Format</div>
        <select
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onFormat(e.target.value as Format)
          }
        >
          <option value={'H264'}>H.264 over RTP</option>
          <option value={'MJPEG'}>JPEG over RTP</option>
          <option value={'JPEG'}>Still image</option>
        </select>
      </SettingsItem>
      <SettingsItem>
        <div>Resolution</div>
        <select
          value={parameters['resolution']}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            if (e.target.value === '') {
              onVapix('resolution', '')
              return
            }
            onVapix('resolution', e.target.value)
          }}
        >
          <option value="">default</option>
          <option value="1920x1080">1920 x 1080 (FHD)</option>
          <option value="1280x720">1280 x 720 (HD)</option>
          <option value="800x600">800 x 600 (VGA)</option>
        </select>
      </SettingsItem>
      <SettingsItem>
        <div>Rotation</div>
        <select
          value={parameters['rotation']}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            onVapix('rotation', e.target.value)
          }}
        >
          <option value="0">0</option>
          <option value="90">90</option>
          <option value="180">180</option>
          <option value="270">270</option>
        </select>
      </SettingsItem>
      <SettingsItem>
        <div>Compression</div>
        <select
          value={parameters['compression']}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            onVapix('compression', e.target.value)
          }}
        >
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
        <input
          name="text"
          type="checkbox"
          checked={parameters['text'] === '1'}
          onChange={changeParam}
        />
        <input
          name="textstring"
          value={parameters['textstring']}
          onChange={changeParam}
        />
      </SettingsItem>
    </SettingsMenu>
  )
}
