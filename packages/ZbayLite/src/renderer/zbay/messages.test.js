import { DateTime } from 'luxon'
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import { createTransfer, createMessage, createChannel, createIdentity, now } from '../testUtils'
import { packMemo, unpackMemo } from './transit'
import zbayMessages, { transferToMessage, messageToTransfer, messageType } from './messages'
import { Identity } from '../store/handlers/identity'

describe('messages -', () => {
  describe('transfer to message', () => {
    const txid = 'test-id'
    const spent = '234.56'

    beforeEach(() => {
      jest.spyOn(DateTime, 'utc').mockReturnValueOnce(now)
      jest.clearAllMocks()
    })

    it('when memo is a message', async () => {
      const message = R.omit(['id', 'spent'], createMessage(txid))
      const transfer = createTransfer({
        txid,
        memo: await packMemo(message),
        amount: spent
      })

      const received = await transferToMessage(transfer)

      const expected = { ...message, spent: new BigNumber(spent), id: txid }
      expect(received).toEqual(expected)
    })

    it('when on testnet', async () => {
      const message = R.omit(['id', 'spent'], createMessage(txid))
      const transfer = createTransfer({
        txid,
        memo: await packMemo(message),
        amount: spent
      })

      const received = await transferToMessage(transfer, true)

      expect(received).toMatchSnapshot()
    })

    it('when memo isn\'t compressed string', async () => {
      jest.spyOn(console, 'warn').mockImplementation()
      const transfer = createTransfer({
        txid,
        memo: 'random memo',
        amount: spent
      })

      expect(transferToMessage(transfer)).resolves.toBeNull()
      expect(console.warn.mock.calls).toMatchSnapshot()
    })
  })

  describe('message to transfer', () => {
    it('creates transfer from simple message', async () => {
      jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
      const identity = Identity({
        address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya',
        name: 'Mercury'
      }).toJS()
      const message = createMessage({
        messageData: {
          type: messageType.BASIC,
          data: 'This is some simple message created by client'
        },
        identity
      })
      const channel = createChannel('test-id')
      const amount = '0.1'

      const { amounts, ...result } = await messageToTransfer({ message, channel, amount })

      // We have to deflate memo since encryption may be a little different on each run
      // and the test may flicker

      expect(result).toEqual({ from: identity.address })

      expect(amounts).toHaveLength(1)
      const [{ memo, ...amountSent }] = amounts
      expect(amountSent).toEqual({
        address: channel.address,
        amount
      })

      const sentMemo = await unpackMemo(memo)
      expect(sentMemo).toMatchSnapshot()
    })
  })

  it('message -> transfer -> message', async () => {
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
    const identity = Identity({
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya',
      name: 'Mercury'
    }).toJS()
    const txid = 'test-op-id'
    const message = createMessage({
      messageData: {
        type: messageType.BASIC,
        data: 'This is some simple message created by client'
      },
      identity
    })
    const channel = createChannel('test-id')
    const amount = '0.1'

    const transfer = await messageToTransfer({ message, channel, amount })
    const receivedTransfer = {
      txid,
      amount: transfer.amounts[0].amount,
      memo: transfer.amounts[0].memo
    }
    const receivedMessage = await transferToMessage(receivedTransfer)

    expect(receivedMessage).toEqual({
      ...message,
      id: txid,
      spent: new BigNumber(amount)
    })
  })

  it('calculate diff', async () => {
    const identity = createIdentity()
    const messages = R.range(0, 4).map(i => zbayMessages.createMessage({
      identity,
      messageData: {
        type: messageType.BASIC,
        data: `This is message nr ${i}`
      }
    }))
    const newMessage = zbayMessages.createMessage({
      identity,
      messageData: {
        type: messageType.BASIC,
        data: 'This is a new message'
      }
    })
    const newMessages = Immutable.fromJS([
      ...messages,
      newMessage
    ])

    const diff = zbayMessages.calculateDiff(Immutable.fromJS(messages), newMessages)
    expect(diff).toMatchSnapshot()
  })
})
