/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash')

import Immutable from 'immutable'
import { DateTime } from 'luxon'

import create from '../create'
import { uriToChannel } from '../../zbay/channels'
import importedChannelHandlers, { ImportedChannelState } from './importedChannel'
import importedChannelSelectors from '../selectors/importedChannel'
import channelsSelectors from '../selectors/channels'
import notificationsSelectors from '../selectors/notifications'
import { IdentityState, Identity } from './identity'
import { getVault, mock } from '../../vault'
import { getClient } from '../../zcash'
import { createArchive } from '../../vault/marshalling'
import { now } from '../../testUtils'
import { NodeState } from './node'
import zbayChannels from '../../zcash/channels'
import { ChannelsState } from './channels'
import { ChannelState } from './channel'

describe('Imported channel reducer handles', () => {
  let store = null
  const id = 'general-channel-id'
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          isTestnet: true
        }),
        channel: ChannelState({
          address: 'test-address'
        }),
        channels: ChannelsState({
          data: [
            Immutable.fromJS({
              ...zbayChannels.general.testnet,
              id
            })
          ]
        }),
        importedChannel: ImportedChannelState(),
        identity: IdentityState({
          data: Identity({
            address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
            name: 'Saturn',
            id: 'this-is-a-test-identity-id',
            balance: '33.583004'
          })
        })
      })
    })
    jest.clearAllMocks()
  })

  const channelUri = `eJwNjV1uhiAUBfficx+oCEh3Q+ACHyDhispP073Xl5NMMpnzu2R1wPKzOMhwqrR8LZ8nvjz784FWv7FFRntHdIgFT+PdfrS9m3Jq6QxPthjjhpqyMyaY7jBeH2wnaya1FUVP34+6v7nA17mqbPbLTwsUR6JRoCtxYy6pd8msIwtyIZuUixykWI8Z78t0pVMzTIZckbQdmVSx8jPcsq6Pu8WQqBOg4CXdcFy+xZy2Tb9nM2wzEFvwtp5bmNqmPZXy9GMCUOsYdda3YcgQlLl+++Z75shgPFkPkFYn02ax4moznLm5yOE+wvL3DzjjcxI=`
  const address = 'address123'
  describe('actions', () => {
    it('handles setData', async () => {
      const channel = await uriToChannel(channelUri)
      await store.dispatch(importedChannelHandlers.actions.setData({ ...channel, address: address }))

      const data = importedChannelSelectors.data(store.getState())
      expect(data).toMatchSnapshot()
    })

    it('handles setDecoding', async () => {
      await store.dispatch(importedChannelHandlers.actions.setDecoding(true))

      const decoding = importedChannelSelectors.decoding(store.getState())
      expect(decoding).toBeTruthy()
    })

    it('handles setDecodingError', async () => {
      await store.dispatch(importedChannelHandlers.actions.setDecodingError(new Error('this is a test error')))

      const errors = importedChannelSelectors.errors(store.getState())
      expect(errors).toMatchSnapshot()
    })

    it('handles clear', async () => {
      const channel = await uriToChannel(channelUri)
      await store.dispatch(importedChannelHandlers.actions.setData({ ...channel, address: address }))
      store.dispatch(importedChannelHandlers.actions.clear())

      const decoding = importedChannelSelectors.decoding(store.getState())
      const errors = importedChannelSelectors.errors(store.getState())
      const data = importedChannelSelectors.data(store.getState())
      expect(decoding).toBeFalsy()
      expect(errors).toBeFalsy()
      expect(data).toBeNull()
    })
  })

  describe('epics', () => {
    describe('importChannel', () => {
      getClient.mockImplementation(() => ({
        keys: {
          importIVK: jest.fn(() => ({ address: 'testaddress' }))
        }
      }))
      it('saves channel in vault', async () => {
        const importChannelMock = jest.fn(() => Promise.resolve())
        getVault.mockImplementationOnce(() => ({
          channels: {
            importChannel: importChannelMock
          }
        }))
        await store.dispatch(importedChannelHandlers.epics.decodeChannel(channelUri))

        await store.dispatch(importedChannelHandlers.epics.importChannel())

        expect(importChannelMock.mock.calls).toMatchSnapshot()
      })

      it('reloads channels', async () => {
        jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
        mock.setArchive(createArchive())
        await store.dispatch(importedChannelHandlers.epics.decodeChannel(channelUri))

        await store.dispatch(importedChannelHandlers.epics.importChannel())

        const channels = channelsSelectors.data(store.getState())
        expect(
          channels.map(c => c.delete('id'))
        ).toMatchSnapshot()
      })

      it('dispatches notification on success', async () => {
        mock.setArchive(createArchive())
        await store.dispatch(importedChannelHandlers.epics.decodeChannel(channelUri))

        await store.dispatch(importedChannelHandlers.epics.importChannel())

        const notifications = notificationsSelectors.data(store.getState())
        expect(
          notifications.map(n => n.delete('key'))
        ).toMatchSnapshot()
      })

      it('dispatches notification on failure', async () => {
        getVault.mockImplementationOnce(() => ({
          channels: {
            importChannel: jest.fn(() => Promise.reject(new Error('test error')))
          }
        }))
        await store.dispatch(importedChannelHandlers.epics.decodeChannel(channelUri))

        await store.dispatch(importedChannelHandlers.epics.importChannel())

        const notifications = notificationsSelectors.data(store.getState())
        expect(
          notifications.map(n => n.delete('key'))
        ).toMatchSnapshot()
      })
    })

    describe('decodeChannel', () => {
      it('decodes uri', async () => {
        await store.dispatch(importedChannelHandlers.epics.decodeChannel(channelUri))

        const data = importedChannelSelectors.data(store.getState())
        expect(data).toMatchSnapshot()
      })

      it('sends notification on failure', async () => {
        await store.dispatch(importedChannelHandlers.epics.decodeChannel('incorrect-uri'))

        const data = importedChannelSelectors.data(store.getState())
        const notifications = notificationsSelectors.data(store.getState())
        expect(data).toBeNull()
        expect(
          notifications.map(n => n.delete('key'))
        ).toMatchSnapshot()
      })
    })

    describe('removeChannel', () => {
      it('calls remove channel', async () => {
        const removeChannelMock = jest.fn(() => Promise.resolve())
        getVault.mockImplementationOnce(() => ({
          channels: {
            removeChannel: removeChannelMock
          }
        }))
        await store.dispatch(importedChannelHandlers.epics.removeChannel())

        expect(removeChannelMock.mock.calls).toMatchSnapshot()
      })
    })
  })
})
