import React from 'react'
import Config from 'react-native-config'

import { renderComponent } from '../../../tests/utils/renderComponent'
import type { Store } from '../../../store/store.types'
import type { FactoryGirl } from 'factory-girl'
import { prepareStore } from '../../../tests/utils/prepareStore'
import { getReduxStoreFactory, publicChannels } from '@quiet/state-manager'
import { ChannelContextMenu } from './ChannelContextMenu.container'
import type { PublicChannel } from '@quiet/types'
import { DateTime } from 'luxon'
import { generateTestChannelId } from '@quiet/common'

jest.mock('react-native-share', () => ({ default: { open: jest.fn() } }))
jest.mock('../../../utils/sendLogs', () => ({ sendLogs: jest.fn() }))
jest.mock('../../../utils/shareAllData', () => ({ shareAllData: jest.fn() }))
jest.mock('../../../hooks/useContextMenu', () => ({
  useContextMenu: () => ({ visible: true, handleOpen: jest.fn(), handleClose: jest.fn() }),
}))

const mutableConfig = Config as { NODE_ENV?: string }

describe('ChannelContextMenu (permissions gate for "Delete channel")', () => {
  let store: Store
  let factory: FactoryGirl
  let publicChannel: PublicChannel
  let privateChannel: PublicChannel

  beforeEach(async () => {
    store = (await prepareStore()).store
    factory = await getReduxStoreFactory(store)
    publicChannel = (await factory.create('PublicChannel')).channel
    privateChannel = (
      await factory.create('PublicChannel', {
        channel: {
          name: 'priv',
          description: `Welcome to #priv`,
          timestamp: DateTime.utc().valueOf(),
          id: generateTestChannelId('priv'),
          public: false,
          owner: 'foobar',
          teamId: 'barbaz',
        },
      })
    ).channel
  })

  describe('Private channel', () => {
    beforeEach(() => {
      store.dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: privateChannel.id,
        })
      )
    })

    it('hides "Delete channel" without permissions', () => {
      const { queryByText } = renderComponent(<ChannelContextMenu />, store)
      expect(queryByText('Delete channel')).toBeNull()
    })

    it('shows "Delete channel" with permissions', async () => {
      await factory.create('ChannelPermissions', {
        channelSpecificPermissions: [
          { channelId: privateChannel.id, addMembers: true, delete: true, removeMembers: true },
        ],
      })
      const { queryByText } = renderComponent(<ChannelContextMenu />, store)
      expect(queryByText('Delete channel')).not.toBeNull()
    })
  })

  describe('Public channel', () => {
    beforeEach(() => {
      store.dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: publicChannel.id,
        })
      )
    })

    it('hides "Delete channel" without permissions', () => {
      const { queryByText } = renderComponent(<ChannelContextMenu />, store)
      expect(queryByText('Delete channel')).toBeNull()
    })

    it('shows "Delete channel" with permissions', async () => {
      await factory.create('ChannelPermissions')
      const { queryByText } = renderComponent(<ChannelContextMenu />, store)
      expect(queryByText('Delete channel')).not.toBeNull()
    })
  })
})

describe('ChannelContextMenu (permissions gate for channel membership)', () => {
  let store: Store
  let factory: FactoryGirl
  let publicChannel: PublicChannel
  let privateChannel: PublicChannel

  beforeEach(async () => {
    store = (await prepareStore()).store
    factory = await getReduxStoreFactory(store)
    publicChannel = (await factory.create('PublicChannel')).channel
    privateChannel = (
      await factory.create('PublicChannel', {
        channel: {
          name: 'priv',
          description: `Welcome to #priv`,
          timestamp: DateTime.utc().valueOf(),
          id: generateTestChannelId('priv'),
          public: false,
          owner: 'foobar',
          teamId: 'barbaz',
        },
      })
    ).channel
  })

  describe('Private channel', () => {
    beforeEach(() => {
      store.dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: privateChannel.id,
        })
      )
    })

    it('shows "Members in this channel" without permissions', () => {
      const { queryByText } = renderComponent(<ChannelContextMenu />, store)
      expect(queryByText('Members in this channel')).not.toBeNull()
      expect(queryByText('Permissions')).toBeNull()
    })

    it('shows "Permissions" with permissions', async () => {
      await factory.create('ChannelPermissions', {
        channelSpecificPermissions: [
          { channelId: privateChannel.id, addMembers: true, delete: true, removeMembers: true },
        ],
      })
      const { queryByText } = renderComponent(<ChannelContextMenu />, store)
      expect(queryByText('Permissions')).not.toBeNull()
      expect(queryByText('Members in this channel')).toBeNull()
    })
  })

  describe('Public channel', () => {
    beforeEach(() => {
      store.dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: publicChannel.id,
        })
      )
    })

    it('hides membership item on public channels', () => {
      const { queryByText } = renderComponent(<ChannelContextMenu />, store)
      expect(queryByText('Members in this channel')).toBeNull()
      expect(queryByText('Permissions')).toBeNull()
    })
  })
})
