/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash')

import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'

import create from '../create'
import { packMemo, unpackMemo } from '../../zbay/transit'
import { ChannelState, actions, epics } from './channel'
import { initialState as pendingMessagesInitialState } from './pendingMessages'
import { ChannelsState } from './channels'
import { IdentityState, Identity } from './identity'
import channelSelectors from '../selectors/channel'
import pendingMessagesSelectors from '../selectors/pendingMessages'
import { mockEvent } from '../../../shared/testing/mocks'
import { createChannel, createTransfer, createMessage, now } from '../../testUtils'
import { mock as zcashMock } from '../../zcash'

describe('channel reducer', () => {
  const spent = 0.2
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
        pendingMessages: pendingMessagesInitialState
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

    it('- loadMessages', async () => {
      const transfers = await Promise.all(
        messages.map(async (m) => createTransfer({
          txid: m.id,
          memo: await packMemo(m),
          amount: spent
        }))
      )
      zcashMock.requestManager.z_listreceivedbyaddress.mockImplementationOnce(async () => transfers)

      await store.dispatch(actions.loadMessages('test-address'))

      const loadedMessages = channelSelectors.messages(store.getState())
      const expectedMessages = messages.map(m => ({ ...m, spent: new BigNumber(spent) }))
      expect(loadedMessages.toJS()).toEqual(expectedMessages)
      expect(zcashMock.requestManager.z_listreceivedbyaddress.mock.calls).toMatchSnapshot()
    })
  })

  describe('handles epics', () => {
    it('- loadMessages loads for current channel', async () => {
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

        expect(zcashMock.requestManager.z_sendmany).toHaveBeenCalled()
        const [from, amounts] = zcashMock.requestManager.z_sendmany.mock.calls[0]
        expect(from).toEqual(address)
        const withUnpacked = {
          ...amounts[0],
          memo: await unpackMemo(amounts[0].memo)
        }
        expect(withUnpacked).toMatchSnapshot()
        expect(
          channelSelectors.message(store.getState())
        ).toEqual('')
      })

      it('doesn\'t send when shift is pressed', async () => {
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 13, true)
        store.dispatch(actions.setChannelId('this-is-a-test-id'))

        await store.dispatch(epics.sendOnEnter(event))

        expect(zcashMock.requestManager.z_sendmany).not.toHaveBeenCalled()
      })

      it('doesn\'t send when enter not pressed', async () => {
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 23, false)
        store.dispatch(actions.setChannelId('this-is-a-test-id'))

        await store.dispatch(epics.sendOnEnter(event))

        expect(zcashMock.requestManager.z_sendmany).not.toHaveBeenCalled()
      })

      it('creates and resolves pending message on finish', async () => {
        jest.spyOn(DateTime, 'utc').mockReturnValue(now)
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 13, false)
        store.dispatch(actions.setChannelId('this-is-a-test-id'))

        await store.dispatch(epics.sendOnEnter(event))

        expect(pendingMessagesSelectors.pendingMessages(store.getState())).toMatchSnapshot()
      })
    })
  })
})
