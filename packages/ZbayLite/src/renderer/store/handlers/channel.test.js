/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash')

import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'

import create from '../create'
import { packMemo, unpackMemo } from '../../zbay/transit'
import { ChannelState, actions, epics } from './channel'
import { ChannelsState } from './channels'
import { IdentityState, Identity } from './identity'
import channelSelectors from '../selectors/channel'
import { mockEvent } from '../../../shared/testing/mocks'
import { createChannel, createTransfer, createMessage, now } from '../../testUtils'
import { getClient } from '../../zcash'

describe('channel reducer', () => {
  const spent = 0.2
  const messages = [
    createMessage('test-1'),
    createMessage('test-2')
  ]
  const receivedMock = jest.fn(async () => [])
  const sendMock = jest.fn(async () => null)
  getClient.mockImplementation(() => ({
    payment: {
      received: receivedMock,
      send: sendMock
    }
  }))
  const address = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya'

  let store = null
  beforeEach(async () => {
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
        })
      })
    })
    jest.clearAllMocks()
  })

  // const assertStoreState = () => expect(
  //   channelSelectors.channel(store.getState())
  // ).toMatchSnapshot()

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
      receivedMock.mockImplementationOnce(async () => transfers)

      await store.dispatch(actions.loadMessages('test-address'))

      const loadedMessages = channelSelectors.messages(store.getState())
      const expectedMessages = messages.map(m => ({ ...m, spent: new BigNumber(spent) }))
      expect(loadedMessages.toJS()).toEqual(expectedMessages)
      expect(receivedMock.mock.calls).toMatchSnapshot()
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
      receivedMock.mockImplementationOnce(async () => transfers)
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
      receivedMock.mockImplementationOnce(async () => transfers)

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

      it('sends message', async () => {
        jest.spyOn(DateTime, 'utc').mockReturnValue(now)
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 13, false)
        store.dispatch(actions.setChannelId('this-is-a-test-id'))

        await store.dispatch(epics.sendOnEnter(event))

        expect(sendMock).toHaveBeenCalled()
        const [call] = sendMock.mock.calls[0]
        const { from, amounts } = call
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

        expect(sendMock).not.toHaveBeenCalled()
      })

      it('doesn\'t send when enter not pressed', async () => {
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 23, false)
        store.dispatch(actions.setChannelId('this-is-a-test-id'))

        await store.dispatch(epics.sendOnEnter(event))

        expect(sendMock).not.toHaveBeenCalled()
      })
    })
  })
})
