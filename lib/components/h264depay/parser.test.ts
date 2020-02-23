import { H264DepayParser } from './parser'
import { MessageType } from '../message'
import { AssertionError } from 'assert'

/*
 * The h264Handler is more thoroughly tested in the end2end test.
 *
 */
describe('h264 handler', () => {
  let h264Parser: H264DepayParser

  beforeEach(() => {
    h264Parser = new H264DepayParser()
  })

  it('parses a single NALU packet', () => {
    const singleNalu = Buffer.from('gOATzCCbbTXpPLiiQZrALBJ/AEphqA==', 'base64')
    const msg = h264Parser.parse({
      type: MessageType.RTP,
      data: singleNalu,
      channel: 0,
    })

    expect(msg).not.toBeNull()
    expect((h264Parser as any)._buffer.length).toEqual(0)

    if (msg === null) {
      throw new AssertionError()
    }
    expect(msg.timestamp).toEqual(547056949)
    expect(msg.type).toEqual(MessageType.H264)
    expect(msg.data.length).toEqual(14)
    expect(msg.payloadType).toEqual(96)
  })

  it('parses a FU-A frame split on two RTP packages', () => {
    /*eslint-disable */
    const fuaPart1 = Buffer.from(
      'gGBwUAkfABNeSvUmfIWIgwAAv7fhaOZ7/8I48OQXY7Fpl6o9HpvJiYz5b2JyowHtuVDBxLY9ZL8FHJOD6rs6h91CSMQmA9fgnTDCVgJ5vdm99c7OMzF3l4K9+VJeZ4eKyC32WVXoVh3h+KVVJERORlYXJDq+1IlMC0EzAqltdPKwC1UmwbsMgtz6fjR/v19wZf0DXOfxTBnb0OnN83kR5G8TffuGm2njvkWsEX7ecpJDzhu0Wn0RZ9Z0I39RuOT5hHrKKSMQSfwWbITrzL+j5bneysE7nAD9mPsEQxqH99GPZodENIbuYhog8TS/Qlv+Ty20GkAZfbZILfjoELO9ahh2wQgLaGd031W4Z7bmM7WACu7fPVm4blRP1rhomufuUAD8ceqjqxcivy5CxeyWS764bBNkffWBVHL7PpzXPhd4e56YduXnWwQO1REIs2MiPfyx7UumMIwDCCKhgDf3BUxWuSXVqcORn0aSp7k8SFCM/767e1peyADK+WKuWVDbrDvPW2igZKBADyashVjvNhdaHJBCWPOpVwfghRhSjeaK2k6/OdY6ebpRDv4J7ZnUCGnNspqy6fo5WbUoQwc4+3xXbq8lN7kYP9zSH4iExe7f//+9flejgJql61Z4A34bwazQ/KlCmySYm/cbIyWuZVQo0R8=',
      'base64',
    )
    const fuaPart2 = Buffer.from(
      'gOBwUQkfABNeSvUmfEV10JWHPGgQDhsFYeRYLNcUCLF5ek1hA7BRpPeURyWGQa9vOSr5DM0WpqX78A==',
      'base64',
    )
    /* eslint-enable */
    let msg = h264Parser.parse({
      type: MessageType.RTP,
      data: fuaPart1,
      channel: 0,
    })
    expect(msg).toBeNull()
    expect((h264Parser as any)._buffer.length).toBeGreaterThan(0)

    msg = h264Parser.parse({
      type: MessageType.RTP,
      data: fuaPart2,
      channel: 0,
    })
    expect(msg).not.toBeNull()

    if (msg === null) {
      throw new AssertionError()
    }
    expect(msg.timestamp).toEqual(153026579)
    expect(msg.type).toEqual(MessageType.H264)
    expect(msg.data.length).toEqual(535)
    expect(msg.payloadType).toEqual(96)
  })
})
