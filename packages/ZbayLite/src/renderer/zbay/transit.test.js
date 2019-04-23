import * as R from 'ramda'

import { packMemo, unpackMemo, MEMO_SIZE } from './transit'
import { now } from '../testUtils'
import { messageType } from './messages'

describe('transit', () => {
  const message = {
    sender: {
      replyTo: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya',
      username: 'Mercury'
    },
    createdAt: now.toSeconds(),
    type: messageType.BASIC,
    message: 'This is a simple message'
  }

  describe('pack/unpack memo', () => {
    it('is symmetrical', async () => {
      const data = await packMemo(message)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data, false)
      expect(output).toEqual(message)
    })

    it('when no username', async () => {
      const messageNoUsername = {
        ...message,
        sender: R.omit(['username'], message.sender)
      }
      const data = await packMemo(messageNoUsername)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data, false)
      expect(output).toEqual(messageNoUsername)
    })
  })
})
