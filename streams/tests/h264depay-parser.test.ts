import * as assert from 'uvu/assert'

import { AssertionError } from 'assert'
import { H264DepayParser } from 'components/h264depay/parser'
import { MessageType } from 'components/message'

import { describe } from './uvu-describe'

/*
 * The h264Handler is more thoroughly tested in the end2end test.
 */
describe('h264 parser', (test) => {
  test.before.each((ctx) => {
    ctx.h264Parser = new H264DepayParser()
  })

  test('parses a single NALU packet', (ctx) => {
    const singleNalu = Buffer.from('gOATzCCbbTXpPLiiQZrALBJ/AEphqA==', 'base64')
    const msg = ctx.h264Parser.parse({
      type: MessageType.RTP,
      data: singleNalu,
      channel: 0,
    })

    assert.is.not(msg, null)

    assert.is((ctx.h264Parser as any)._buffer.length, 0)

    if (msg === null) {
      throw new AssertionError()
    }
    assert.is(msg.timestamp, 547056949)
    assert.is(msg.type, MessageType.H264)
    assert.is(msg.data.length, 14)
    assert.is(msg.payloadType, 96)
  })

  test('parses a FU-A frame split on two RTP packages', (ctx) => {
    const fuaPart1 = Buffer.from(
      'gGBwUAkfABNeSvUmfIWIgwAAv7fhaOZ7/8I48OQXY7Fpl6o9HpvJiYz5b2JyowHtuVDBxLY9ZL8FHJOD6rs6h91CSMQmA9fgnTDCVgJ5vdm99c7OMzF3l4K9+VJeZ4eKyC32WVXoVh3h+KVVJERORlYXJDq+1IlMC0EzAqltdPKwC1UmwbsMgtz6fjR/v19wZf0DXOfxTBnb0OnN83kR5G8TffuGm2njvkWsEX7ecpJDzhu0Wn0RZ9Z0I39RuOT5hHrKKSMQSfwWbITrzL+j5bneysE7nAD9mPsEQxqH99GPZodENIbuYhog8TS/Qlv+Ty20GkAZfbZILfjoELO9ahh2wQgLaGd031W4Z7bmM7WACu7fPVm4blRP1rhomufuUAD8ceqjqxcivy5CxeyWS764bBNkffWBVHL7PpzXPhd4e56YduXnWwQO1REIs2MiPfyx7UumMIwDCCKhgDf3BUxWuSXVqcORn0aSp7k8SFCM/767e1peyADK+WKuWVDbrDvPW2igZKBADyashVjvNhdaHJBCWPOpVwfghRhSjeaK2k6/OdY6ebpRDv4J7ZnUCGnNspqy6fo5WbUoQwc4+3xXbq8lN7kYP9zSH4iExe7f//+9flejgJql61Z4A34bwazQ/KlCmySYm/cbIyWuZVQo0R8=',
      'base64'
    )
    const fuaPart2 = Buffer.from(
      'gOBwUQkfABNeSvUmfEV10JWHPGgQDhsFYeRYLNcUCLF5ek1hA7BRpPeURyWGQa9vOSr5DM0WpqX78A==',
      'base64'
    )
    /* eslint-enable */
    let msg = ctx.h264Parser.parse({
      type: MessageType.RTP,
      data: fuaPart1,
      channel: 0,
    })
    assert.is(msg, null)

    assert.ok((ctx.h264Parser as any)._buffer.length > 0)

    msg = ctx.h264Parser.parse({
      type: MessageType.RTP,
      data: fuaPart2,
      channel: 0,
    })
    assert.is.not(msg, null)

    if (msg === null) {
      throw new AssertionError()
    }
    assert.is(msg.timestamp, 153026579)
    assert.is(msg.type, MessageType.H264)
    assert.is(msg.data.length, 535)
    assert.is(msg.payloadType, 96)
  })
})
