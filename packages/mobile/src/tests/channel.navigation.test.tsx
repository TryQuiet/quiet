import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { screen, fireEvent } from '@testing-library/react-native'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../setupTests'
import { prepareStore } from './utils/prepareStore'
import { renderComponent } from './utils/renderComponent'
import { AppHomeScreen } from '../screens/AppHome/AppHome.screen'
import { ChannelScreen } from '../screens/Channel/Channel.screen'
import { FactoryGirl } from 'factory-girl'
import { getReduxStoreFactory, communities, identity } from '@quiet/state-manager'

describe('Channel navigation', () => {
  let socket: MockedSocket

  let factory: FactoryGirl

  beforeEach(async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  test('user opens channel screen, navigating from channel list', async () => {
    const { store, root } = await prepareStore({}, socket)

    factory = await getReduxStoreFactory(store)

    const community = await factory.create('Community')

    await factory.create('Identity', {
      communityId: community.id,
    })

    renderComponent(
      <>
        <AppHomeScreen />
        <ChannelScreen />
      </>,
      store
    )

    const channel = screen.getByTestId('channel_tile_general')

    expect(channel).toBeVisible()

    fireEvent.press(channel)

    const chat = screen.getByTestId('chat_general')

    expect(chat).toBeVisible()

    // Stop state-manager sagas
    root?.cancel()
  })
})
