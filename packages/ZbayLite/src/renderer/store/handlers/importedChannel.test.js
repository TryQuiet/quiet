/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash')

import Immutable from 'immutable'

import create from '../create'
import importedChannelHandlers, { ImportedChannelState } from './importedChannel'
import importedChannelSelectors from '../selectors/importedChannel'
import channelsSelectors from '../selectors/channels'
import notificationsSelectors from '../selectors/notifications'
import { IdentityState, Identity } from './identity'
import { getVault, mock } from '../../vault'
import { createArchive } from '../../vault/marshalling'

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

  const channelUri = 'zbay.io/channel/eJxNj8FugzAMhl8lyrmaOgoM9hw97WbAISHBDYmhTaq++9LDpEmW/oM/+f/8lAQrym95xciGZjFqIEInT9IHcwCXHYcdTxKmKWCMBc1c2AjeFf6zxfqOdlvSozunZcmqqjMn5bgaG+YWDq5J8UxL29fUYfPoVG586HGJ08X1bk2rqnqrF7Klc8I4BuPZ3OjtpE0UZUDMSBjA/dkJOMA4GBwKvglwTuwRQxQ3JX4GSGJIYkIFu+OPctRiKtpPaQ77ti/x/wHfBF+NObPrYAW3rc2s86HDpaFzp6v20F7TvXq0trtwUPwVt0j9ZqdWvl6/PI1yUA=='

  describe('actions', () => {
    it('handles decodeChannel', async () => {
      await store.dispatch(importedChannelHandlers.actions.decodeChannel(channelUri))

      const decoding = importedChannelSelectors.decoding(store.getState())
      const errors = importedChannelSelectors.errors(store.getState())
      const data = importedChannelSelectors.data(store.getState())
      expect(decoding).toBeFalsy()
      expect(errors).toBeFalsy()
      expect(data).toMatchSnapshot()
    })

    it('handles failing decodeChannel', async () => {
      expect.assertions(3)
      try {
        await store.dispatch(importedChannelHandlers.actions.decodeChannel('incorrect-uri'))
      } catch (err) {
        const decoding = importedChannelSelectors.decoding(store.getState())
        const errors = importedChannelSelectors.errors(store.getState())
        const data = importedChannelSelectors.data(store.getState())
        expect(decoding).toBeFalsy()
        expect(data).toBeNull()
        expect(errors).toMatchSnapshot()
      }
    })

    it('handles clear', async () => {
      await store.dispatch(importedChannelHandlers.actions.decodeChannel(channelUri))
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
        await store.dispatch(importedChannelHandlers.actions.decodeChannel(channelUri))

        await store.dispatch(importedChannelHandlers.epics.importChannel())

        expect(importChannelMock.mock.calls).toMatchSnapshot()
      })

      it('reloads channels', async () => {
        mock.setArchive(createArchive())
        await store.dispatch(importedChannelHandlers.actions.decodeChannel(channelUri))

        await store.dispatch(importedChannelHandlers.epics.importChannel())

        const channels = channelsSelectors.data(store.getState())
        expect(
          channels.map(c => c.delete('id'))
        ).toMatchSnapshot()
      })

      it('dispatches notification on success', async () => {
        mock.setArchive(createArchive())
        await store.dispatch(importedChannelHandlers.actions.decodeChannel(channelUri))

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
        await store.dispatch(importedChannelHandlers.actions.decodeChannel(channelUri))

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
