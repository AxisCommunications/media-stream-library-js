import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import { toByteArray } from 'base64-js'

import { H264Depay, H264Media, RtpMessage } from '../src/streams/components'

import { parseRtp } from '../src/streams/components/rtsp/rtp'

const mediaFixture: H264Media = {
  type: 'video',
  port: 0,
  protocol: 'RTP/AVP',
  fmt: 96,
  rtpmap: { payloadType: 96, clockrate: 90000, encodingName: 'H264' },
  fmtp: {
    format: '96',
    parameters: {
      'packetization-mode': '1',
      'profile-level-id': '4d0029',
      'sprop-parameter-sets': 'Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==',
    },
  },
}

/*
 * The h264Handler is more thoroughly tested in the end2end test.
 */
describe('h264 parser', (test) => {
  test('parses a single NALU packet', () => {
    const h264Depay = new H264Depay([mediaFixture])
    const singleNalu = toByteArray('gOATzCCbbTXpPLiiQZrALBJ/AEphqA==')
    const msg = h264Depay.parse(
      new RtpMessage({
        channel: 0,
        ...parseRtp(singleNalu),
      })
    )

    assert.ok(msg)
    assert.is(msg.timestamp, 547056949)
    assert.is(msg.type, 'h264')
    assert.is(msg.data.length, 14)
    assert.is(msg.payloadType, 96)
  })

  test('parses a FU-A frame split on two RTP packages', () => {
    const h264Depay = new H264Depay([mediaFixture])
    const fuaPart1 = toByteArray(
      'gGBwUAkfABNeSvUmfIWIgwAAv7fhaOZ7/8I48OQXY7Fpl6o9HpvJiYz5b2JyowHtuVDBxLY9ZL8FHJOD6rs6h91CSMQmA9fgnTDCVgJ5vdm99c7OMzF3l4K9+VJeZ4eKyC32WVXoVh3h+KVVJERORlYXJDq+1IlMC0EzAqltdPKwC1UmwbsMgtz6fjR/v19wZf0DXOfxTBnb0OnN83kR5G8TffuGm2njvkWsEX7ecpJDzhu0Wn0RZ9Z0I39RuOT5hHrKKSMQSfwWbITrzL+j5bneysE7nAD9mPsEQxqH99GPZodENIbuYhog8TS/Qlv+Ty20GkAZfbZILfjoELO9ahh2wQgLaGd031W4Z7bmM7WACu7fPVm4blRP1rhomufuUAD8ceqjqxcivy5CxeyWS764bBNkffWBVHL7PpzXPhd4e56YduXnWwQO1REIs2MiPfyx7UumMIwDCCKhgDf3BUxWuSXVqcORn0aSp7k8SFCM/767e1peyADK+WKuWVDbrDvPW2igZKBADyashVjvNhdaHJBCWPOpVwfghRhSjeaK2k6/OdY6ebpRDv4J7ZnUCGnNspqy6fo5WbUoQwc4+3xXbq8lN7kYP9zSH4iExe7f//+9flejgJql61Z4A34bwazQ/KlCmySYm/cbIyWuZVQo0R8='
    )
    const fuaPart2 = toByteArray(
      'gOBwUQkfABNeSvUmfEV10JWHPGgQDhsFYeRYLNcUCLF5ek1hA7BRpPeURyWGQa9vOSr5DM0WpqX78A=='
    )
    let msg = h264Depay.parse(
      new RtpMessage({
        channel: 0,
        ...parseRtp(fuaPart1),
      })
    )

    assert.is(msg, undefined)

    msg = h264Depay.parse(
      new RtpMessage({
        channel: 0,
        ...parseRtp(fuaPart2),
      })
    )

    assert.ok(msg)
    assert.is(msg.timestamp, 153026579)
    assert.is(msg.type, 'h264')
    assert.is(msg.data.length, 535)
    assert.is(msg.payloadType, 96)
  })
})
