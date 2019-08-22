import { packMemo, unpackMemo, MEMO_SIZE } from './transit'
import { now } from '../testUtils'
import { messageType } from './messages'

describe('transit', () => {
  const message = {
    type: messageType.BASIC,
    signature: Buffer.from(
      '8e81f917e771ab0041a453ae775acdcfa55310f562ab4b52f900487495bd277d0902f0cba98ec809cc392d67d4aac579416ea10fbf5a0e37bd54ba26e4e8002d',
      'hex'
    ),
    createdAt: now.toSeconds(),
    message: 'This is a simple message'
  }
  describe('pack/unpack memo', () => {
    it('is symmetrical', async () => {
      const data = await packMemo(message)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data, false)
      expect(output).toEqual(message)
    })
  })
})
