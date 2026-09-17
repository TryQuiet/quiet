import React from 'react'
import Config from 'react-native-config'

import { renderComponent } from '../../../tests/utils/renderComponent'
import type { Store } from '../../../store/store.types'
import type { FactoryGirl } from 'factory-girl'
import { prepareStore } from '../../../tests/utils/prepareStore'
import { getBaseTypesFactory, getReduxStoreFactory, publicChannels, users } from '@quiet/state-manager'
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

    // The design's Permissions row carries the member count as its right-hand suffix, before the
    // chevron (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9190).
    it('shows the member count beside the membership row, and no subtitle', async () => {
      await factory.create('ChannelPermissions', {
        channelSpecificPermissions: [
          { channelId: privateChannel.id, addMembers: true, delete: true, removeMembers: true },
        ],
      })
      const baseTypesFactory = await getBaseTypesFactory()
      const memberIds = ['alice', 'bob']
      const everyone = [...memberIds, 'carol']
      store.dispatch(
        users.actions.setUserProfiles(
          await Promise.all(
            everyone.map(userId => baseTypesFactory.create('UserProfile', { userId, nickname: userId }))
          )
        )
      )
      // A profile's `channels` is derived by the selector from the User record's channelIds, so
      // membership has to be seeded there rather than on the profile.
      store.dispatch(
        users.actions.setUsers(
          everyone.map(userId => ({
            userId,
            isRegistered: true,
            isDuplicated: false,
            channelIds: memberIds.includes(userId) ? [privateChannel.id] : [],
          }))
        )
      )

      const { queryByText } = renderComponent(<ChannelContextMenu />, store)

      expect(queryByText('Members in this channel')).not.toBeNull()
      // Only the two who belong to the private channel are counted.
      expect(queryByText('2')).not.toBeNull()
      // The design's "Roles and members" subtitle is dropped until roles exist; with only members
      // it would say nothing the count does not already say.
      expect(queryByText('Roles and members')).toBeNull()
    })

    // The row reads the same for everyone. Whether you can change the membership is shown inside
    // the screen by the Add members button, not by the row renaming itself depending on who looks —
    // and "Permissions" would promise governance this screen does not have while roles are absent.
    it('shows the same membership row to an admin', async () => {
      await factory.create('ChannelPermissions', {
        channelSpecificPermissions: [
          { channelId: privateChannel.id, addMembers: true, delete: true, removeMembers: true },
        ],
      })
      const { queryByText } = renderComponent(<ChannelContextMenu />, store)
      expect(queryByText('Members in this channel')).not.toBeNull()
      expect(queryByText('Permissions')).toBeNull()
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

    // A public channel has no per-channel permissions in state, so nobody reads as its admin and
    // everyone gets the read-only entry.
    it('shows the read-only membership item on public channels', () => {
      const { queryByText } = renderComponent(<ChannelContextMenu />, store)
      expect(queryByText('Members in this channel')).not.toBeNull()
      expect(queryByText('Permissions')).toBeNull()
    })
  })
})
