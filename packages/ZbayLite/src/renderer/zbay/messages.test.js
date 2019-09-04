import { DateTime } from 'luxon'
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import testUtils from '../testUtils'
import { packMemo, unpackMemo } from './transit'
import zbayMessages, { transferToMessage, messageToTransfer, messageType } from './messages'
import { Identity } from '../store/handlers/identity'
import { ReceivedMessage } from '../store/handlers/messages'

describe('messages -', () => {
  describe('transfer to message', () => {
    const txid = 'test-id'
    const spent = '234.56'
    const privateKey = 'ceea41a1c9e91f839c96fba253b620da70992954b2a28b19322b191d8f5e56db'
    const pKey = Buffer.alloc(32)
    pKey.write(privateKey, 0, 'hex')

    beforeEach(() => {
      jest.spyOn(DateTime, 'utc').mockReturnValueOnce(testUtils.now)
      jest.clearAllMocks()
    })

    it('when memo is a message', async () => {
      const message = testUtils.messages.createMessage(txid)
      const transfer = testUtils.transfers.createTransfer({
        txid,
        memo: await packMemo(message),
        amount: spent
      })

      const received = await transferToMessage(transfer)

      const expected = {
        ...message,
        spent: new BigNumber(spent),
        id: txid,
        r: 0,
        sender: { replyTo: '', username: 'Unnamed' }
      }
      expect(received).toEqual(expected)
    })

    it('when on testnet', async () => {
      const message = testUtils.messages.createMessage(txid)
      const transfer = testUtils.transfers.createTransfer({
        txid,
        memo: await packMemo(message),
        amount: spent
      })
      const received = await transferToMessage(transfer)
      expect(received).toMatchSnapshot()
    })

    it("when memo isn't compressed string", async () => {
      jest.spyOn(console, 'warn').mockImplementation()
      const transfer = testUtils.transfers.createTransfer({
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
      jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => testUtils.now)
      const identity = Identity({
        address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya',
        name: 'Mercury'
      }).toJS()
      const message = testUtils.messages.createMessage({
        messageData: {
          type: messageType.BASIC,
          data: 'This is some simple message created by client'
        },
        identity
      })
      const channel = testUtils.channels.createChannel('test-id')
      const amount = '0.1'

      const { amounts } = await messageToTransfer({ message, channel, amount })

      // We have to deflate memo since encryption may be a little different on each run
      // and the test may flicker

      expect(amounts).toHaveLength(1)
      const [{ memo, ...amountSent }] = amounts
      expect(amountSent).toEqual({
        address: channel.address,
        amount: amount.toString()
      })

      const sentMemo = await unpackMemo(memo)
      expect(sentMemo).toMatchSnapshot()
    })
  })

  it('message -> transfer -> message', async () => {
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => testUtils.now)
    const txid = 'test-op-id'
    const message = testUtils.messages.createMessage('test-op-id12')
    const channel = testUtils.channels.createChannel('test-id')
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
      r: 0,
      spent: new BigNumber(amount),
      sender: { replyTo: '', username: 'Unnamed' }
    })
  })

  describe('calculate diff', () => {
    const nextMessages = Immutable.List(
      R.range(0, 5).map(id =>
        ReceivedMessage(
          testUtils.messages.createReceivedMessage({
            id,
            createdAt: testUtils.now.minus({ hours: 2 * id }).toSeconds(),
            sender: testUtils.identities[1]
          })
        )
      )
    )

    const previousMessages = nextMessages.slice(0, 3)

    const lastSeen = testUtils.now.minus({ hours: 2 * nextMessages.size })
    const identityAddress = testUtils.identities[0].address

    it('when no new messages', () => {
      const diff = zbayMessages.calculateDiff({
        previousMessages,
        nextMessages: previousMessages,
        identityAddress,
        lastSeen
      })
      expect(diff).toMatchSnapshot()
    })

    it('when new messages', () => {
      const diff = zbayMessages.calculateDiff({
        previousMessages,
        nextMessages,
        identityAddress,
        lastSeen
      })
      expect(diff).toMatchSnapshot()
    })

    it('when new messages but some were already seen', () => {
      const diff = zbayMessages.calculateDiff({
        previousMessages,
        nextMessages,
        identityAddress,
        lastSeen: testUtils.now.minus({ hours: 2 * (nextMessages.size - 1) - 1 })
      })
      expect(diff).toMatchSnapshot()
    })

    it('when some messages disappeared', () => {
      const diff = zbayMessages.calculateDiff({
        previousMessages,
        nextMessages: previousMessages.pop(),
        identityAddress,
        lastSeen
      })
      expect(diff).toMatchSnapshot()
    })

    it('when no previous messages', () => {
      const diff = zbayMessages.calculateDiff({
        previousMessages: Immutable.List(),
        nextMessages,
        identityAddress,
        lastSeen
      })
      expect(diff).toMatchSnapshot()
    })
  })
})
