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

    expect(screen.getByText('Members')).toBeVisible()
    expect(screen.getByTestId('user_tile_alice')).toBeVisible()

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
