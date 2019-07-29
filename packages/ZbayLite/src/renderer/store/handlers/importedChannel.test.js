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
import { createArchive } from '../../vault/marshalling'
import { now } from '../../testUtils'

describe('Imported channel reducer handles', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
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

  const channelUri = 'zbay.io/channel/eJxNj0tuhDAQRK9ieR1FE36BXCAXyCq7BtoY3DRg9zBjj+bucZRNpJJKqkXVq4dmWFF/6E9k9ED6RcM4egwhZ0kwSICdZp7eGqxu6I4l3ttLXJZkiipJNCTFUIs0cErFRiZemq7iFut7a1K9+w6XMJbU0RpXU3TOLuzyyIhh8PMu88Z56MvOQWWBmv4w1GCBGUnBCTNBT6hkU0CkrgF9UJtR3z1E1Uc1ooEryWsudRgz9kPPp/ulz/b/wF77vRhSEmphBTrWerLptL6s+dLaojntbvlW3BvXluKNvIcjcHe4sdHP5w8SWGnS'

  describe('actions', () => {
    it('handles setData', async () => {
      const channel = await uriToChannel(channelUri)
      await store.dispatch(importedChannelHandlers.actions.setData(channel))

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
      await store.dispatch(importedChannelHandlers.actions.setData(channel))
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
  })
})
