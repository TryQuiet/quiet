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
import identityHandlers, { IdentityState, Identity } from './identity'
import channelSelectors from '../selectors/channel'
import channelsSelectors from '../selectors/channels'
import messagesSelectors from '../selectors/messages'
import operationsSelectors from '../selectors/operations'
import { mockEvent } from '../../../shared/testing/mocks'
import { createIdentity, createTransfer, createMessage, now } from '../../testUtils'
import { mock as zcashMock } from '../../zcash'
import { mock as vaultMock, getVault } from '../../vault'
import { createArchive } from '../../vault/marshalling'
import { NodeState } from './node'

describe('channel reducer', () => {
  const spent = 0.2
  const identityId = 'test-identity-id'
  const messages = [
    createMessage('test-1'),
    createMessage('test-2')
  ]
  const address = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya'
  let channel

  let store = null
  beforeEach(async () => {
    window.Notification = jest.fn()
    vaultMock.workspace.archive = createArchive()
    vaultMock.workspace.save = jest.fn()
    const channelMeta = {
      name: 'Channel 1',
      private: true,
      address: 'zs1testaddress$1',
      unread: 1,
      description: 'Channel about 1',
      keys: {
        ivk: 'incoming-viewing-key-1'
      }
    }

    await getVault().channels.importChannel(identityId, channelMeta)
    const channels = await getVault().channels.listChannels(identityId)
    channel = channels[0]

    store = create({
      initialState: Immutable.Map({
        channel: ChannelState(),
        channels: ChannelsState({
          data: Immutable.fromJS([channel])
        }),
        node: NodeState({
          isTestnet: true
        }),
        identity: IdentityState({
          data: Identity({
            id: identityId,
            address,
            name: 'Saturn',
            balance: '33.583004'
          })
        }),
        operations: Immutable.Map()
      })
    })
    jest.spyOn(DateTime, 'utc').mockImplementation(() => now)
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
      store.dispatch(actions.setLoading(false))
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
    it('- resendMessage resend selected message', async () => {
      store.dispatch(actions.setChannelId(channel.id))
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
          channelId: channel.id,
          message
        }),
        type: operationTypes.pendingMessage,
        opId
      }))
      const beforeResend = operationsSelectors.pendingMessages(store.getState())
      expect(beforeResend.getIn([opId, 'status'])).toEqual('failed')

      await store.dispatch(epics.resendMessage(message))

      const pendingMessages = operationsSelectors.pendingMessages(store.getState())
      expect(pendingMessages.map(m => m.removeIn(['meta', 'channelId']))).toMatchSnapshot()
    })

    describe('- updateLastSeen', () => {
      it('updates lastSeen in vault', async () => {
        const transfers = await Promise.all(
          messages.map(async (m) => createTransfer({
            txid: m.id,
            memo: await packMemo(m),
            amount: spent
          }))
        )
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementationOnce(async () => transfers)
        const newLastSeen = now.plus({ hours: 2 })
        jest.spyOn(DateTime, 'utc').mockImplementation(() => newLastSeen)

        await store.dispatch(epics.loadChannel(channel.id))

        const [vaultUpdatedChannel] = await getVault().channels.listChannels(identityId)
        expect(vaultUpdatedChannel.lastSeen).toEqual(newLastSeen)
      })

      it('updates lastSeen in store', async () => {
        const transfers = await Promise.all(
          messages.map(async (m) => createTransfer({
            txid: m.id,
            memo: await packMemo(m),
            amount: spent
          }))
        )
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementationOnce(async () => transfers)
        const newLastSeen = now.plus({ hours: 2 })
        jest.spyOn(DateTime, 'utc').mockImplementation(() => newLastSeen)

        await store.dispatch(epics.loadChannel(channel.id))

        const updatedChannel = channelsSelectors.channelById(channel.id)(store.getState())
        expect(updatedChannel.get('lastSeen')).toEqual(newLastSeen)
      })
    })

    describe('-clearNewMessages', () => {
      it('clears new messages for current channel', async () => {
        const identity = createIdentity()
        await store.dispatch(identityHandlers.actions.setIdentity(identity))
        const transfers = await Promise.all(
          messages.map(async (m) => createTransfer({
            txid: m.id,
            memo: await packMemo(m),
            amount: spent
          }))
        )
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementationOnce(async () => transfers)
        const newLastSeen = now.minus({ hours: 2 })
        jest.spyOn(DateTime, 'utc').mockImplementation(() => newLastSeen)
        await store.dispatch(epics.loadChannel(channel.id))

        await store.dispatch(epics.clearNewMessages())

        const result = messagesSelectors.messages(store.getState())
        expect(result.get(channel.id)).toMatchSnapshot()
      })
    })

    describe('- loadChannel', () => {
      it('updates lastSeen', async () => {
        const transfers = await Promise.all(
          messages.map(async (m) => createTransfer({
            txid: m.id,
            memo: await packMemo(m),
            amount: spent
          }))
        )
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementationOnce(async () => transfers)
        const newLastSeen = now.plus({ hours: 2 })
        jest.spyOn(DateTime, 'utc').mockImplementation(() => newLastSeen)

        await store.dispatch(epics.loadChannel(channel.id))

        const updatedChannel = channelsSelectors.channelById(channel.id)(store.getState())
        const [vaultUpdatedChannel] = await getVault().channels.listChannels(identityId)
        expect(updatedChannel.get('lastSeen')).toEqual(newLastSeen)
        expect(vaultUpdatedChannel.lastSeen).toEqual(newLastSeen)
      })

      it('fetches messages', async () => {
        const transfers = await Promise.all(
          messages.map(async (m) => createTransfer({
            txid: m.id,
            memo: await packMemo(m),
            amount: spent
          }))
        )
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementationOnce(async () => transfers)
        const newLastSeen = now.plus({ hours: 2 })
        jest.spyOn(DateTime, 'utc').mockImplementation(() => newLastSeen)

        await store.dispatch(epics.loadChannel(channel.id))

        const loadedMessages = channelSelectors.messages(store.getState())
        expect(loadedMessages).toMatchSnapshot()
      })

      it('sets uri', async () => {
        const transfers = await Promise.all(
          messages.map(async (m) => createTransfer({
            txid: m.id,
            memo: await packMemo(m),
            amount: spent
          }))
        )
        zcashMock.requestManager.z_listreceivedbyaddress.mockImplementationOnce(async () => transfers)
        const newLastSeen = now.plus({ hours: 2 })
        jest.spyOn(DateTime, 'utc').mockImplementation(() => newLastSeen)

        await store.dispatch(epics.loadChannel(channel.id))

        expect(channelSelectors.shareableUri(store.getState())).toMatchSnapshot()
      })
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
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 13, false)
        store.dispatch(actions.setChannelId(channel.id))

        await store.dispatch(epics.sendOnEnter(event))

        const [[{ channelId, message }]] = messagesQueueHandlers.epics.addMessage.mock.calls
        expect(channelId).toEqual(channel.id)
        expect(message).toMatchSnapshot()
      })

      it('doesn\'t send when shift is pressed', async () => {
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 13, true)
        store.dispatch(actions.setChannelId(channel.id))

        await store.dispatch(epics.sendOnEnter(event))

        expect(messagesQueueHandlers.epics.addMessage).not.toHaveBeenCalled()
      })

      it('doesn\'t send when enter not pressed', async () => {
        const msg = 'this is some message'
        const event = keyPressEvent(msg, 23, false)
        store.dispatch(actions.setChannelId(channel.id))

        await store.dispatch(epics.sendOnEnter(event))

        expect(messagesQueueHandlers.epics.addMessage).not.toHaveBeenCalled()
      })
    })
  })
})
