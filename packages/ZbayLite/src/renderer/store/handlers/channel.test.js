/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash')
jest.mock('./messagesQueue', () => ({
  ...jest.requireActual('./messagesQueue'),
  epics: {
    addMessage: jest.fn(() => jest.fn().mockResolvedValue())
  }
}))

import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'

import create from '../create'
import { packMemo } from '../../zbay/transit'
import { ChannelState, actions, epics } from './channel'
import operationsHandlers, { operationTypes, PendingMessageOp } from './operations'
import messagesQueueHandlers from './messagesQueue'
import { ChannelsState } from './channels'
import { IdentityState, Identity } from './identity'
import channelSelectors from '../selectors/channel'
import operationsSelectors from '../selectors/operations'
import { mockEvent } from '../../../shared/testing/mocks'
import { createChannel, createTransfer, createMessage, now } from '../../testUtils'
import { mock as zcashMock } from '../../zcash'

describe('channel reducer', () => {
  const spent = 0.2
  const channelId = 'this-is-a-test-id'
  const messages = [
    createMessage('test-1'),
    createMessage('test-2')
  ]
  const address = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya'

  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        channel: ChannelState(),
        channels: ChannelsState({
          data: Immutable.fromJS([
            createChannel('this-is-a-test-id')
          ])
        }),
        identity: IdentityState({
          data: Identity({
            address,
            name: 'Saturn',
            balance: '33.583004'
          })
        }),
        operations: Immutable.Map()
      })
    })
    jest.clearAllMocks()
  })

  describe('handles actions', () => {
    it(' - setSpentFilterValue', () => {
      const spent = '232.223'
      store.dispatch(actions.setSpentFilterValue(jest.mock(), spent))
      const filterValue = channelSelectors.spentFilterValue(store.getState())
      expect(filterValue).toEqual(new BigNumber(spent))
    })

    it(' - setMessage', () => {
      const msg = 'this is a test message'
      const event = mockEvent(msg)
      store.dispatch(actions.setMessage(event))
      const result = channelSelectors.message(store.getState())
      expect(result).toEqual(msg)
    })

    it('- setChannelId', () => {
      store.dispatch(actions.setChannelId('this-is-a-test-id'))
      const channel = channelSelectors.channel(store.getState())
      expect(channel).toMatchSnapshot()
    })

    it('- setLoading', () => {
      store.dispatch(actions.setLoading(true))
      const channel = channelSelectors.channel(store.getState())
      expect(channel).toMatchSnapshot()
    })

    it('- setLoadingMessage', () => {
      store.dispatch(actions.setLoadingMessage('this is a loading message'))
      const channel = channelSelectors.channel(store.getState())
      expect(channel).toMatchSnapshot()
    })

    it('- setShareableUri', () => {
      store.dispatch(actions.setShareableUri('zbay.io/channel/this-is-a-hash'))
      const channel = channelSelectors.channel(store.getState())
      expect(channel).toMatchSnapshot()
    })
  })

  describe('handles epics', () => {
    describe('- loadMessages', () => {
      it('loads for current channel', async () => {
        const transfers = await Promise.all(
          messages.map(async (m) => createTransfer({
            txid: m.id,
            memo: await packMemo(m),
            amount: spent
          }))
        )
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementationOnce(async () => transfers)
        store.dispatch(actions.setChannelId('this-is-a-test-id'))

        await store.dispatch(epics.loadMessages())

        const loadedMessages = channelSelectors.messages(store.getState())
        expect(loadedMessages).toMatchSnapshot()
      })

      it('clears out pending messages', async () => {
        jest.useFakeTimers()
        store.dispatch(actions.setChannelId(channelId))
        const getTxId = message => `${message.id}-tx-id`

        // Generate transfers for message that will be returned from the node
        const transfers = await Promise.all(
          messages.map(async (m) => createTransfer({
            txid: getTxId(m),
            memo: await packMemo(m),
            amount: spent
          }))
        )
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementationOnce(async () => transfers)

        // Generate pending messages for messages
        await Promise.all(messages.map(
          m => {
            const opId = `${m.id}-op`
            zcashMock.requestManager.z_getoperationstatus.mockImplementationOnce(async () => [{
              id: opId,
              status: 'success',
              result: {
                txid: getTxId(m)
              },
              error: { code: -1, message: 'no error' }
            }])

            store.dispatch(operationsHandlers.epics.observeOperation({
              opId,
              type: operationTypes.pendingMessage,
              meta: PendingMessageOp({
                channelId,
                message: m
              })
            }))
          }))
        expect(operationsSelectors.pendingMessages(store.getState())).toMatchSnapshot()

        await store.dispatch(epics.loadMessages())

        expect(operationsSelectors.pendingMessages(store.getState())).toEqual(Immutable.Map())
      })
    })

    it('- resendMessage resend selected message', async () => {
      store.dispatch(actions.setChannelId(channelId))
      const opId = `message-op-id`
      const message = {
        ...messages[0],
        id: opId
      }
      zcashMock.requestManager.z_getoperationstatus.mockImplementationOnce(async () => [{
        id: opId,
        status: 'failed',
        result: {
          txid: 'message-op-id'
        },
        error: { code: -1, message: 'no funds' }
      }])
      zcashMock.requestManager.z_sendmany.mockResolvedValue('new-op-id')

      await store.dispatch(operationsHandlers.epics.observeOperation({
        meta: PendingMessageOp({
          channelId,
          message
        }),
        type: operationTypes.pendingMessage,
        opId
      }))
      const beforeResend = operationsSelectors.pendingMessages(store.getState())
      expect(beforeResend.getIn([opId, 'status'])).toEqual('failed')

      await store.dispatch(epics.resendMessage(message))

      expect(operationsSelectors.pendingMessages(store.getState())).toMatchSnapshot()
    })

    it('- loadChannel', async () => {
      const transfers = await Promise.all(
        messages.map(async (m) => createTransfer({
          txid: m.id,
          memo: await packMemo(m),
          amount: spent
        }))
      )
      zcashMock.requestManager.z_listreceivedbyaddress.mockImplementationOnce(async () => transfers)

      await store.dispatch(epics.loadChannel('this-is-a-test-id'))

      const loadedMessages = channelSelectors.messages(store.getState())
      expect(loadedMessages).toMatchSnapshot()
    })

    describe('- sendOnEnter', () => {
      const keyPressEvent = (value, keyCode, withShift) => {
        const event = jest.mock()
        event.nativeEvent = jest.mock()
        event.target = jest.mock()
        event.preventDefault = jest.fn()
        event.target.value = value
        event.nativeEvent.keyCode = keyCode
        event.nativeEvent.shiftKey = withShift
        return event
      }

      beforeEach(() => {
        zcashMock.requestManager.z_getoperationstatus.mockImplementation(async () => [{
          id: 'operation-id',
          status: 'success',
          result: {
            txid: 'test-tx-id'
          },
          error: { code: -1, message: 'no error' }
        }])
      })

      it('sends message', async () => {
        jest.spyOn(DateTime, 'utc').mockReturnValue(now)
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 13, false)
        store.dispatch(actions.setChannelId('this-is-a-test-id'))

        await store.dispatch(epics.sendOnEnter(event))

        expect(messagesQueueHandlers.epics.addMessage.mock.calls).toMatchSnapshot()
      })

      it('doesn\'t send when shift is pressed', async () => {
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 13, true)
        store.dispatch(actions.setChannelId('this-is-a-test-id'))

        await store.dispatch(epics.sendOnEnter(event))

        expect(messagesQueueHandlers.epics.addMessage).not.toHaveBeenCalled()
      })

      it('doesn\'t send when enter not pressed', async () => {
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 23, false)
        store.dispatch(actions.setChannelId('this-is-a-test-id'))

        await store.dispatch(epics.sendOnEnter(event))

        expect(messagesQueueHandlers.epics.addMessage).not.toHaveBeenCalled()
      })
    })
  })
})
