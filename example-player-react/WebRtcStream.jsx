import React, { useCallback, useMemo, useState } from 'react'

import styled from 'styled-components'

import { BasicPlayer } from 'media-stream-player'

const Wrapper = styled.div`
  display: grid;
  width: 100%;
  grid-auto-flow: row;
  grid-template-rows: min-content auto;
  grid-gap: 32px;
  justify-content: center;
`

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const PlayerContainer = styled.div`
  height: 400px;
  width: 700px;
`

const convertSearchParams = (searchParams) => {
  const params = searchParams.split('&')

  return params.reduce((acc, param) => {
    const [key, value] = param.split('=')
    if (value === '') {
      return acc
    }
    return {
      ...acc,
      [key]: value,
    }
  }, {})
}

/**
 * Example application that uses web RTC streaming and the `BasicPlayer` component.
 */
export const WebRtcStream = () => {
  const [refresh, setRefresh] = useState(0)

  const [formValues, setFormValues] = useState(() => {
    const web_rtc_creds_storage = localStorage.getItem('webrtc_creds')
    if (web_rtc_creds_storage !== null) {
      return JSON.parse(web_rtc_creds_storage)
    }

    return {
      organizationArn: '',
      serial: '',
      env: 'stage',
      token: '',
      params: '',
    }
  })

  const [creds, setCreds] = useState(null)

  const handleSubmit = useCallback((ev) => {
    ev.preventDefault()

    localStorage.setItem('webrtc_creds', JSON.stringify(formValues))

    setCreds(formValues)
    setRefresh(previousValue => previousValue + 1)
  }, [formValues, setCreds, setRefresh])

  const handleChange = useCallback((ev) => {
    ev.preventDefault()
    const nextFormValues = {}
    const nextValue = ev.target.value.trim()
    nextFormValues[ev.target.id] = nextValue

    setCreds(null)
    setFormValues((previousValue) => ({ ...previousValue, ...nextFormValues }))
  }, [setCreds, setFormValues])

  // web RTC signaling requires a promise that returns a token
  const authenticator = useCallback(() => {
    return new Promise(resolve => {
      resolve(creds?.token)
    })
  }, [creds?.token])

  // The signaling options is configuration
  // for web RTC streaming.
  const signalingOptions = useMemo(() => {
    if (creds === null) {
      return
    }
    const { token, params, ...rest } = creds
    const invalidCreds = Object.values(rest).some(value => value === '')
    if (invalidCreds) {
      return undefined
    }
    return {
      ...rest,
      authenticator,
    }
  }, [authenticator, creds])

  const vapixParams = useMemo(() => {
    if (formValues.params === '') {
      return undefined
    }

    return convertSearchParams(formValues.params)
  }, [formValues])

  return (
    <Wrapper>
      <StyledForm
        onSubmit={handleSubmit}
      >
        <label htmlFor="organizationArn">Organization arn</label>
        <input
          id="organizationArn"
          type="text"
          placeholder="00000000-0000-0000-0000-000000000000"
          value={formValues.organizationArn}
          onChange={handleChange}
        />

        <label htmlFor="serial">Device S/N</label>
        <input
          id="serial"
          type="text"
          placeholder="AA11BB22BB33"
          value={formValues.serial}
          onChange={handleChange}
        />

        <label htmlFor="token">Bearer token</label>
        <textarea
          id="token"
          placeholder="xxx-xxx-xxx-xxx"
          value={formValues.token}
          onChange={handleChange}
        />

        <label htmlFor="env">Environment</label>
        <select
          id="env"
          value={formValues.env}
          onChange={handleChange}
        >
          <option value="stage">stage</option>
          <option value="prod">prod</option>
        </select>

        <label htmlFor="params">
          Stream parameters (supported: width, height, channel, framerate)
        </label>
        <textarea
          id="params"
          type="text"
          placeholder="key=value&key=value"
          value={formValues.params}
          onChange={handleChange}
        />
        {vapixParams !== undefined && (
          <>
            <pre>Params sent to the webRTC session</pre>
            <pre>{JSON.stringify(vapixParams, null, 2)}</pre>
          </>
        )}

        <button style={{ width: '150px', alignSelf: 'center' }} type="submit">
          Submit
        </button>
      </StyledForm>
      {creds !== null && (
        <PlayerContainer>
          <BasicPlayer
            hostname={window.location.host}
            format="WEBRTC"
            autoPlay
            autoRetry
            refresh={refresh}
            {...(signalingOptions !== undefined ? { signalingOptions } : {})}
            {...(creds.params !== undefined
              ? { vapixParams: convertSearchParams(creds.params) }
              : {})}
          />
        </PlayerContainer>
      )}
    </Wrapper>
  )
}
