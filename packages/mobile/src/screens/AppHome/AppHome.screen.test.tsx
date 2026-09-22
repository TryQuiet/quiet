import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { fireEvent, screen } from '@testing-library/react-native'
import MockedSocket from 'socket.io-mock'
import { FactoryGirl } from 'factory-girl'
import { getReduxStoreFactory, publicChannels } from '@quiet/state-manager'
import { ChannelType, EMPTY_CHANNEL_ID } from '@quiet/types'

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
    await factory.create('Identity', { communityId: community.id })
    return { store, root, community }
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

  it('lists a direct message and opens its channel, not a member roster', async () => {
    const { store, root } = await prepare()
    await factory.create('PublicChannel', {
      channel: {
        name: 'alice',
        description: '',
        owner: 'alice',
        timestamp: 0,
        id: 'alice-dm-id',
        public: false,
        type: ChannelType.DM,
        memberIds: ['me-id', 'alice-id'],
      },
      // The factory takes the displayed name beside the channel, not inside it.
      displayedName: 'alice',
    })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    renderComponent(<AppHomeScreen />, store)

    expect(screen.getByText('Direct messages')).toBeVisible()
    fireEvent.press(screen.getByTestId('dm_tile_alice'))

    expect(dispatchSpy).toHaveBeenCalledWith(
      publicChannels.actions.setCurrentChannel({ channelId: 'alice-dm-id' })
    )

    root?.cancel()
  })

  it('starts a new direct message from the section plus', async () => {
    const { store, root } = await prepare()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    renderComponent(<AppHomeScreen />, store)

    fireEvent.press(screen.getByTestId('New direct message'))

    // An empty conversation, exactly what the old pencil button opened.
    expect(dispatchSpy).toHaveBeenCalledWith(
      publicChannels.actions.setCurrentChannel({ channelId: EMPTY_CHANNEL_ID })
    )
    expect(dispatchSpy).toHaveBeenCalledWith(publicChannels.actions.setNewMessageOpen({ isOpen: true }))

    root?.cancel()
  })
})
