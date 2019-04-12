import * as R from 'ramda'

import { createTransfer, createMessage } from '../testUtils'
import { deflate } from '../compression'
import { transferToMessage } from './messages'

describe('messages', () => {
  describe('transfer to message', () => {
    it('when memo is a message', async () => {
      const txid = 'test-id'
      const spent = '234.56'
      const message = R.omit(['id', 'spent'], createMessage(txid))
      const transfer = createTransfer({
        txid,
        memo: await deflate(message),
        amount: spent
      })

      const received = await transferToMessage(transfer)

      const expected = { ...message, spent, id: txid }
      expect(received).toEqual(expected)
    })
  })
})
