import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/dom'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'

import Sidebar from '../renderer/components/Sidebar/Sidebar'
import Channel from '../renderer/components/Channel/Channel'

import { getFactory, identity, publicChannels, communities } from '@quiet/nectar'

import { DateTime } from 'luxon'

jest.setTimeout(20_000)

describe('Switch channels', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('Opens another channel', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const generalChannelMessage = await factory.create<
    ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', { identity: alice, verifyAutomatically: true })

    await factory.create<ReturnType<typeof publicChannels.actions.addChannel>['payload']>(
      'PublicChannel',
      {
        communityId: community.id,
        channel: {
          name: 'memes',
          description: 'Welcome to #memes',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          address: 'memes'
        }
      }
    )

    renderComponent(
      <>
        <Sidebar />
        <Channel />
      </>,
      store
    )

    // Check if defaultly selected channel is #general
    const channelTitle = screen.getByTestId('channelTitle')
    expect(channelTitle).toHaveTextContent('#general')

    // Check if message is visible within the channel page
    let message = screen.getByText(generalChannelMessage.message.message)
    expect(message).toBeVisible()

    // Select another channel
    const memesChannelLink = screen.getByTestId('memes-link')
    userEvent.click(memesChannelLink)
    // Confirm selected channel has changed
    expect(channelTitle).toHaveTextContent('#memes')
    // Confirm the message from #general channel is no longer visible
    expect(message).not.toBeVisible()

    // Go back to #general channel
    const generalChannelLink = screen.getByTestId('general-link')
    userEvent.click(generalChannelLink)
    // Confirm selected channel has changed
    expect(channelTitle).toHaveTextContent('#general')
    // Confirm the message from #general channel is visible back again
    message = screen.getByText(generalChannelMessage.message.message)
    expect(message).toBeVisible()
  })
})
