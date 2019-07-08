/* eslint import/first: 0 */
jest.mock('../../zcash')

import Immutable from 'immutable'
import * as R from 'ramda'

import create from '../create'
import { actions, epics, initialState, DEFAULT_DEBOUNCE_INTERVAL } from './messagesQueue'
import selectors from '../selectors/messagesQueue'
import operationsSelectors from '../selectors/operations'
import notificationsSelectors from '../selectors/notifications'
import { createMessage, createChannel, now } from '../../testUtils'
import { ChannelsState } from './channels'
import { messageType } from '../../zbay/messages'
import { mock as zcashMock } from '../../zcash'

jest.useFakeTimers()

describe('Messages queue reducer handles', () => {
  let store = null

  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        messagesQueue: initialState,
        channels: ChannelsState({
          data: R.range(0, 3).map(
            R.compose(
              Immutable.fromJS,
              createChannel
            )
          )
        })
      })
    })
    jest.clearAllMocks()
  })

  describe('actions', () => {
    describe('- addMessage', () => {
      it('when empty', () => {
        const message = createMessage('test-message-id')
        store.dispatch(actions.addMessage({ message, channelId: 'test-channel-id' }))
        expect(selectors.queue(store.getState())).toMatchSnapshot()
      })

      it('when has matching message', () => {
        const message = createMessage('test-message-id', now.toSeconds())
        const message2 = createMessage('test-message-id-2', now.plus({ seconds: 1 }).toSeconds())
        store.dispatch(actions.addMessage({ message, channelId: 'test-channel-id' }))
        store.dispatch(actions.addMessage({ message: message2, channelId: 'test-channel-id' }))
        expect(selectors.queue(store.getState())).toMatchSnapshot()
      })

      it('when different channel', () => {
        const message = createMessage('test-message-id', now.toSeconds())
        const message2 = createMessage('test-message-id-2', now.plus({ seconds: 1 }).toSeconds())
        store.dispatch(actions.addMessage({ message, channelId: 'test-channel-id' }))
        store.dispatch(actions.addMessage({ message: message2, channelId: 'test-channel-id-2' }))
        expect(selectors.queue(store.getState())).toMatchSnapshot()
      })

      it('when different type', () => {
        const message = createMessage('test-message-id', now.toSeconds())
        const message2 = createMessage('test-message-id-2', now.plus({ seconds: 1 }).toSeconds())
        store.dispatch(actions.addMessage({ message, channelId: 'test-channel-id' }))
        store.dispatch(actions.addMessage({
          message: {
            ...message2,
            type: messageType.AD
          },
          channelId: 'test-channel-id'
        }))
        expect(selectors.queue(store.getState())).toMatchSnapshot()
      })

      it('when different sender', () => {
        const message = createMessage('test-message-id', now.toSeconds())
        const message2 = createMessage('test-message-id-2', now.plus({ seconds: 1 }).toSeconds())
        store.dispatch(actions.addMessage({ message, channelId: 'test-channel-id' }))
        store.dispatch(actions.addMessage({
          message: {
            ...message2,
            sender: {
              replyTo: message2.sender.replyTo,
              username: 'Mercury'
            }
          },
          channelId: 'test-channel-id'
        }))
        expect(selectors.queue(store.getState())).toMatchSnapshot()
      })
    })

    it('- removeMessage', () => {
      const message = createMessage('test-message-id')
      const { payload: { key } } = store.dispatch(actions.addMessage({ message, channelId: 'test-channel-id' }))

      store.dispatch(actions.removeMessage(key))

      expect(selectors.queue(store.getState())).toMatchSnapshot()
    })
  })

  describe('epics', () => {
    describe('- sendPendingMessages', () => {
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

      it('sends messages', async () => {
        store.dispatch(actions.addMessage({
          message: createMessage('test-message-id', now.toSeconds()),
          channelId: 1
        }))
        store.dispatch(actions.addMessage({
          message: createMessage('test-message-id-2', now.plus({ seconds: 1 }).toSeconds()),
          channelId: 2
        }))

        const actionPromise = store.dispatch(epics.sendPendingMessages())
        jest.runAllTimers()
        await actionPromise

        expect(zcashMock.requestManager.z_sendmany.mock.calls).toMatchSnapshot()
      })

      it('adds operation observers', async () => {
        store.dispatch(actions.addMessage({
          message: createMessage('test-message-id', now.toSeconds()),
          channelId: 1
        }))
        store.dispatch(actions.addMessage({
          message: createMessage('test-message-id-2', now.plus({ seconds: 1 }).toSeconds()),
          channelId: 2
        }))
        zcashMock.requestManager.z_sendmany.mockResolvedValueOnce('op-id-1')
          .mockResolvedValueOnce('op-id-2')

        const actionPromise = store.dispatch(epics.sendPendingMessages())
        jest.runAllTimers()
        await actionPromise

        expect(operationsSelectors.operations(store.getState())).toMatchSnapshot()
      })

      it('clears queue', async () => {
        store.dispatch(actions.addMessage({
          message: createMessage('test-message-id', now.toSeconds()),
          channelId: 1
        }))
        store.dispatch(actions.addMessage({
          message: createMessage('test-message-id-2', now.plus({ seconds: 1 }).toSeconds()),
          channelId: 2
        }))

        const actionPromise = store.dispatch(epics.sendPendingMessages())
        jest.runAllTimers()
        await actionPromise

        expect(selectors.queue(store.getState())).toMatchSnapshot()
      })

      it('handles node errors using notifications', async () => {
        store.dispatch(actions.addMessage({
          message: createMessage('test-message-id', now.toSeconds()),
          channelId: 1
        }))
        zcashMock.requestManager.z_sendmany.mockRejectedValue('Test node error')

        const actionPromise = store.dispatch(epics.sendPendingMessages())
        jest.runAllTimers()
        await actionPromise

        const notifications = notificationsSelectors.data(store.getState())
        expect(notifications.map(n => n.remove('key'))).toMatchSnapshot()
      })
    })

    describe('- addMessage', () => {
      beforeEach(() => {
        zcashMock.requestManager.z_getoperationstatus.mockImplementation(async () => [{
          id: 'operation-id',
          status: 'success',
          result: {
            txid: 'test-tx-id'
          },
          error: { code: -1, message: 'no error' }
        }])
        zcashMock.requestManager.z_sendmany.mockResolvedValue('operation-id')
      })

      it('adds and sends message', async () => {
        const message = createMessage('test-message-id')

        const actionPromise = store.dispatch(epics.addMessage({ message, channelId: 1 }))
        jest.runAllTimers()
        await actionPromise

        expect(operationsSelectors.operations(store.getState())).toMatchSnapshot()
      })

      it('debounces sendPendingMessages', async () => {
        const message = createMessage('test-message-id')
        const message2 = createMessage('test-message-id-2')

        store.dispatch(epics.addMessage({ message, channelId: 1 }))
        jest.advanceTimersByTime(DEFAULT_DEBOUNCE_INTERVAL / 2)
        const actionPromise2 = store.dispatch(epics.addMessage({ message: message2, channelId: 1 }))
        jest.advanceTimersByTime(DEFAULT_DEBOUNCE_INTERVAL)
        await actionPromise2

        expect(operationsSelectors.operations(store.getState())).toMatchSnapshot()
      })

      it('does not debounce after interval', async () => {
        zcashMock.requestManager.z_sendmany.mockResolvedValueOnce('operation-id')
          .mockResolvedValueOnce('operation-id-2')
        const message = createMessage('test-message-id')
        const message2 = createMessage('test-message-id-2')

        const actionPromise = store.dispatch(epics.addMessage({ message, channelId: 1 }))
        jest.advanceTimersByTime(DEFAULT_DEBOUNCE_INTERVAL)
        await actionPromise
        const actionPromise2 = store.dispatch(epics.addMessage({ message: message2, channelId: 1 }))
        jest.advanceTimersByTime(DEFAULT_DEBOUNCE_INTERVAL)
        await actionPromise2

        expect(operationsSelectors.operations(store.getState())).toMatchSnapshot()
      })
    })
  })
})
