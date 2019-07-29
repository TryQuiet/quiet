/* eslint import/first: 0 */
jest.mock('../../zcash')

import Immutable from 'immutable'
import * as R from 'ramda'

import handlers, { initialState } from './messages'
import { NodeState } from './node'
import channelsHandlers, { ChannelsState } from './channels'
import operationsHandlers, { operationTypes, PendingMessageOp } from './operations'
import identityHandlers from './identity'
import selectors from '../selectors/messages'
import operationsSelectors from '../selectors/operations'
import criticalErrorSelectors from '../selectors/criticalError'
import create from '../create'
import testUtils from '../../testUtils'
import { mock as zcashMock } from '../../zcash'
import { packMemo } from '../../zbay/transit'
import { transferToMessage } from '../../zbay/messages'

describe('messages reducer', () => {
  let store = null

  const channels = R.range(0, 2).map(
    R.compose(
      Immutable.fromJS,
      testUtils.channels.createChannel
    )
  )

  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        messages: initialState,
        node: NodeState({ isTestnet: false }),
        channels: ChannelsState({
          data: channels
        })
      })
    })
    jest.clearAllMocks()
  })

  describe('handles actions -', () => {
    const channelId = 'test-channel-1'

    describe('setMessages', () => {
      it('sets messages when empty', () => {
        const messages = R.range(0, 3).map(
          id => testUtils.messages.createReceivedMessage({ id: `test-message-${id}` })
        )
        const messages2 = R.range(3, 5).map(
          id => testUtils.messages.createReceivedMessage({ id: `test-message-${id}` })
        )
        const channelId2 = 'test-channel-2'

        store.dispatch(handlers.actions.setMessages({ messages, channelId }))
        store.dispatch(handlers.actions.setMessages({ messages: messages2, channelId: channelId2 }))

        expect(selectors.messages(store.getState())).toMatchSnapshot()
      })

      it('overwrites messages', () => {
        const messages = R.range(0, 3).map(
          id => testUtils.messages.createReceivedMessage({ id: `test-message-${id}` })
        )
        const messages2 = R.range(3, 5).map(
          id => testUtils.messages.createReceivedMessage({ id: `test-message-${id}` })
        )

        store.dispatch(handlers.actions.setMessages({ messages, channelId }))
        store.dispatch(handlers.actions.setMessages({ messages: messages2, channelId }))

        expect(selectors.messages(store.getState())).toMatchSnapshot()
      })
    })

    describe('appendNewMessages', () => {
      it('when there are no new messages', () => {
        const messagesIds = R.range(0, 3).map(i => `message-id-${i}`)

        store.dispatch(handlers.actions.appendNewMessages({ messagesIds, channelId }))

        expect(selectors.messages(store.getState())).toMatchSnapshot()
      })

      it('when there are new messages', () => {
        const messagesIds = R.range(0, 3).map(i => `message-id-${i}`)
        const messagesIds2 = R.range(3, 5).map(i => `message-id-${i}`)

        store.dispatch(handlers.actions.appendNewMessages({ messagesIds, channelId }))
        store.dispatch(handlers.actions.appendNewMessages({ messagesIds: messagesIds2, channelId }))

        expect(selectors.messages(store.getState())).toMatchSnapshot()
      })
    })

    describe('cleanNewMessages', () => {
      it('when there are no new messages', () => {
        store.dispatch(handlers.actions.cleanNewMessages({ channelId }))

        expect(selectors.messages(store.getState())).toMatchSnapshot()
      })

      it('when there are new messages', () => {
        const messagesIds = R.range(0, 3).map(i => `message-id-${i}`)
        store.dispatch(handlers.actions.appendNewMessages({ messagesIds, channelId }))

        store.dispatch(handlers.actions.cleanNewMessages({ channelId }))

        expect(selectors.messages(store.getState())).toMatchSnapshot()
      })
    })
  })

  describe('handles epics -', () => {
    describe('fetch messages', () => {
      const _createMessagesForChannel = num => async (address) => Promise.all(
        R.range(0, num)
          .map(async (i) => {
            const message = testUtils.messages.createSendableMessage({
              message: `message ${i} for ${address}`,
              createdAt: testUtils.now.minus({ hours: i }).toSeconds()
            })
            return testUtils.transfers.createTransfer({
              txid: `tx-id-${i}-${address}`,
              memo: await packMemo(message)
            })
          })
      )

      const assertState = () => {
        expect({
          messages: selectors.messages(store.getState()),
          operations: operationsSelectors.operations(store.getState()),
          criticalError: criticalErrorSelectors.criticalError(store.getState())
        }).toMatchSnapshot()
      }

      const NotificationMock = jest.fn()

      beforeEach(async () => {
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementation(_createMessagesForChannel(2))
        const identity = testUtils.createIdentity()
        await store.dispatch(identityHandlers.actions.setIdentity(identity))
        window.Notification = NotificationMock
      })

      it('when no channel messages', async () => {
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementation(_createMessagesForChannel(2))
        channels.map(ch => store.dispatch(channelsHandlers.actions.setLastSeen({
          lastSeen: testUtils.now.minus({ hours: 3 }),
          channelId: ch.get('id')
        })))

        await store.dispatch(handlers.epics.fetchMessages())

        assertState()
      })

      it('when has to calculate diff', async () => {
        channels.map(ch => store.dispatch(channelsHandlers.actions.setLastSeen({
          lastSeen: testUtils.now.minus({ hours: 3 }),
          channelId: ch.get('id')
        })))
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementation(_createMessagesForChannel(2))
        await store.dispatch(handlers.epics.fetchMessages())

        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementation(_createMessagesForChannel(3))
        await store.dispatch(handlers.epics.fetchMessages())

        assertState()
      })

      it('when lastSeen not set', async () => {
        channels.map(ch => store.dispatch(channelsHandlers.actions.setLastSeen({
          lastSeen: null,
          channelId: ch.get('id')
        })))

        await store.dispatch(handlers.epics.fetchMessages())

        assertState()
      })

      it('when some messages are new', async () => {
        channels.map(ch => store.dispatch(channelsHandlers.actions.setLastSeen({
          lastSeen: testUtils.now.minus({ minutes: 61 }),
          channelId: ch.get('id')
        })))

        await store.dispatch(handlers.epics.fetchMessages())

        assertState()
      })

      it('resolves pending messages', async () => {
        // Received messages
        const channel = channels[0]
        const messages = R.range(0, 3).map(
          i => testUtils.messages.createSendableMessage({
            message: `message ${i} for ${channel.get('address')}`,
            createdAt: testUtils.now.minus({ hours: i }).toSeconds()
          })
        )
        const transfers = await Promise.all(messages.map(
          async (message, index) => testUtils.transfers.createTransfer({
            txid: `tx-id-${index}-${channel.get('address')}`,
            memo: await packMemo(message)
          })
        ))
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementation(
          async (address) => address === channel.get('address') ? transfers : []
        )
        store.dispatch(channelsHandlers.actions.setLastSeen({
          lastSeen: testUtils.now.minus({ hours: 3 }),
          channelId: channel.get('id')
        }))

        // Mock zcash operation
        const receivedMessage = await transferToMessage(transfers[0])
        zcashMock.requestManager.z_getoperationstatus.mockImplementationOnce(async () => [{
          id: 'op-id-1',
          status: 'success',
          result: {
            txid: receivedMessage.id
          },
          error: { code: -1, message: 'no error' }
        }])
        await store.dispatch(operationsHandlers.epics.observeOperation({
          opId: 'op-id-1',
          type: operationTypes.pendingMessage,
          meta: PendingMessageOp({
            channelId: channel.get('id'),
            message: receivedMessage
          })
        }))

        await store.dispatch(handlers.epics.fetchMessages())

        expect(operationsSelectors.operations(store.getState())).toMatchSnapshot()
      })

      it('when new messages are sent by current identity', async () => {
        const identity = testUtils.createIdentity({
          address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya'
        })
        await store.dispatch(identityHandlers.actions.setIdentity(identity))
        channels.map(ch => store.dispatch(channelsHandlers.actions.setLastSeen({
          lastSeen: testUtils.now.minus({ hours: 3 }),
          channelId: ch.get('id')
        })))

        await store.dispatch(handlers.epics.fetchMessages())

        assertState()
      })
    })
  })
})
