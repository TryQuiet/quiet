import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { fireEvent, screen } from '@testing-library/react-native'
import MockedSocket from 'socket.io-mock'
import { FactoryGirl } from 'factory-girl'
import { getReduxStoreFactory, publicChannels } from '@quiet/state-manager'
import { ChannelType } from '@quiet/types'
import { generateDmMemberHash } from '@quiet/common'

import { ioMock } from '../../setupTests'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { AppHomeScreen } from './AppHome.screen'

describe('Community home screen', () => {
  let socket: MockedSocket
  let factory: FactoryGirl

  const prepare = async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    const { store, root } = await prepareStore({}, socket)
    factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community')
    const identity = await factory.create('Identity', { communityId: community.id })
    return { store, root, community, identity }
  }

  it('shows the community name and its channels without message previews', async () => {
    const { store, root, community } = await prepare()
    renderComponent(<AppHomeScreen />, store)

    expect(screen.getByTestId('open_menu')).toBeVisible()
    expect(screen.getByText(community.name.charAt(0).toUpperCase() + community.name.slice(1))).toBeVisible()
    expect(screen.getByTestId('channel_tile_general')).toBeVisible()
    expect(screen.getByText('Add members')).toBeVisible()

    root?.cancel()
  })

  it('hides the create-channel control without the permission', async () => {
    const { store, root } = await prepare()
    renderComponent(<AppHomeScreen />, store)

    expect(screen.queryByTestId('Create channel')).toBeNull()

    root?.cancel()
  })

  it('shows the create-channel control with the permission', async () => {
    const { store, root } = await prepare()
    await factory.create('ChannelPermissions')
    renderComponent(<AppHomeScreen />, store)

    expect(screen.getByTestId('Create channel')).toBeVisible()

    root?.cancel()
  })

  it('lists the community members', async () => {
    const { store, root } = await prepare()
    await factory.create('UserProfile', { userId: 'alice-id', nickname: 'alice' })
    renderComponent(<AppHomeScreen />, store)

    expect(screen.getByText('Direct messages')).toBeVisible()
    expect(screen.getByTestId('user_tile_alice')).toBeVisible()

    root?.cancel()
  })

  /**
   * A DM is a channel underneath, so before this it appeared in the Channels section as a row
   * reading "Direct message" — its own name, not the name of the person in it.
   */
  it('never lists a direct message under Channels', async () => {
    const { store, root, identity } = await prepare()
    await factory.create('UserProfile', { userId: 'alice-id', nickname: 'alice' })
    const memberIds = [identity.userId, 'alice-id']
    await factory.create('PublicChannel', {
      channel: {
        name: 'Direct message',
        description: 'Direct message',
        owner: identity.userId,
        timestamp: 0,
        id: 'alice-dm-id',
        public: false,
        type: ChannelType.DM,
        memberIds,
        memberIdHash: generateDmMemberHash(memberIds),
      },
      displayedName: 'alice',
    })
    renderComponent(<AppHomeScreen />, store)

    // The public channel is listed; the conversation is not, under either name.
    expect(screen.getByTestId('channel_tile_general')).toBeVisible()
    expect(screen.queryByTestId('channel_tile_Direct message')).toBeNull()
    expect(screen.queryByTestId('channel_tile_alice')).toBeNull()
    expect(screen.queryByText('Direct message')).toBeNull()

    // It is reachable as the person it is with.
    expect(screen.getByTestId('user_tile_alice')).toBeVisible()

    root?.cancel()
  })

  // The conversation is not a channel row any more, so its unread mark has to live on the person's
  // row — the frame's `badge2` on `List item--people`.
  it('marks the member row when the conversation with them is unread', async () => {
    const { store, root, identity } = await prepare()
    await factory.create('UserProfile', { userId: 'alice-id', nickname: 'alice' })
    const memberIds = [identity.userId, 'alice-id']
    await factory.create('PublicChannel', {
      channel: {
        name: 'Direct message',
        description: 'Direct message',
        owner: identity.userId,
        timestamp: 0,
        id: 'alice-dm-id',
        public: false,
        type: ChannelType.DM,
        memberIds,
        memberIdHash: generateDmMemberHash(memberIds),
      },
      displayedName: 'alice',
    })
    renderComponent(<AppHomeScreen />, store)
    expect(screen.queryByTestId('user_tile_alice_unread')).toBeNull()

    store.dispatch(publicChannels.actions.markUnreadChannel({ channelId: 'alice-dm-id' }))

    expect(await screen.findByTestId('user_tile_alice_unread')).toBeVisible()
    // The community carries the mark too, since nothing else on this screen shows it.
    expect(screen.getByTestId('community_unread')).toBeVisible()

    root?.cancel()
  })

  it('opens the existing conversation when a member already has one', async () => {
    const { store, root, identity } = await prepare()
    await factory.create('UserProfile', { userId: 'alice-id', nickname: 'alice' })
    const memberIds = [identity.userId, 'alice-id']
    await factory.create('PublicChannel', {
      channel: {
        name: 'alice',
        description: '',
        owner: 'alice',
        timestamp: 0,
        id: 'alice-dm-id',
        public: false,
        type: ChannelType.DM,
        memberIds,
        memberIdHash: generateDmMemberHash(memberIds),
      },
      displayedName: 'alice',
    })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    renderComponent(<AppHomeScreen />, store)

    fireEvent.press(screen.getByTestId('user_tile_alice'))

    expect(dispatchSpy).toHaveBeenCalledWith(publicChannels.actions.setCurrentChannel({ channelId: 'alice-dm-id' }))
    expect(dispatchSpy).toHaveBeenCalledWith(publicChannels.actions.setNewMessageOpen({ isOpen: false }))

    root?.cancel()
  })

  // The frame draws `t-add` on the Direct messages title (6220:10876) just as it does on Channels
  // (6220:10615). Starting a conversation is not permission-gated the way creating a channel is.
  it('opens an empty composer from the Direct messages plus, with or without channel permissions', async () => {
    const { store, root } = await prepare()
    await factory.create('UserProfile', { userId: 'alice-id', nickname: 'alice' })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    renderComponent(<AppHomeScreen />, store)

    // No ChannelPermissions factory here, so the create-channel plus is withheld.
    expect(screen.queryByTestId('Create channel')).toBeNull()
    fireEvent.press(screen.getByTestId('Start dm'))

    expect(dispatchSpy).toHaveBeenCalledWith(publicChannels.actions.setNewMessageOpen({ isOpen: true }))

    root?.cancel()
  })

  it('opens the composer with the member chosen when there is no conversation yet', async () => {
    const { store, root } = await prepare()
    await factory.create('UserProfile', { userId: 'alice-id', nickname: 'alice' })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    renderComponent(<AppHomeScreen />, store)

    fireEvent.press(screen.getByTestId('user_tile_alice'))

    // A DM comes into being with its first message, so nothing is created here.
    expect(dispatchSpy).toHaveBeenCalledWith(
      publicChannels.actions.setNewMessageOpen({ isOpen: true, recipientIds: ['alice-id'] })
    )

    root?.cancel()
  })
})
