import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { screen } from '@testing-library/react-native'
import MockedSocket from 'socket.io-mock'
import { FactoryGirl } from 'factory-girl'
import { getReduxStoreFactory } from '@quiet/state-manager'

import { ioMock } from '../../setupTests'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { ChannelListScreen } from './ChannelList.screen'

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
    renderComponent(<ChannelListScreen />, store)

    expect(screen.getByTestId('open_menu')).toBeVisible()
    expect(screen.getByText(community.name.charAt(0).toUpperCase() + community.name.slice(1))).toBeVisible()
    expect(screen.getByTestId('channel_tile_general')).toBeVisible()
    expect(screen.getByText('Add members')).toBeVisible()

    root?.cancel()
  })

  it('hides the create-channel control without the permission', async () => {
    const { store, root } = await prepare()
    renderComponent(<ChannelListScreen />, store)

    expect(screen.queryByTestId('Create channel')).toBeNull()

    root?.cancel()
  })

  it('shows the create-channel control with the permission', async () => {
    const { store, root } = await prepare()
    await factory.create('ChannelPermissions')
    renderComponent(<ChannelListScreen />, store)

    expect(screen.getByTestId('Create channel')).toBeVisible()

    root?.cancel()
  })
})
