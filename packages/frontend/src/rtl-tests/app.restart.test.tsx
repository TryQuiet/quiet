import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { StoreKeys } from '../renderer/store/store.keys'
import { SocketState } from '../renderer/sagas/socket/socket.slice'
import LoadingPanel from '../renderer/containers/widgets/loadingPanel/loadingPanel'
import JoinCommunity from '../renderer/components/CreateJoinCommunity/JoinCommunity/JoinCommunity'
import CreateCommunity from '../renderer/components/CreateJoinCommunity/CreateCommunity/CreateCommunity'
import Channel from '../renderer/components/Channel/Channel'
import {
  CreateCommunityDictionary,
  JoinCommunityDictionary
} from '../renderer/components/CreateJoinCommunity/community.dictionary'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { LoadingMessages } from '../renderer/containers/widgets/loadingPanel/loadingMessages'
import { identity, communities, getFactory } from '@quiet/nectar'

jest.setTimeout(20_000)

describe('Restart app works correctly', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('Displays channel component, not displays join/create community component', async () => {
    const { store } = await prepareStore(
      {
        [StoreKeys.Socket]: {
          ...new SocketState(),
          isConnected: false
        }
      },
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice'
    })

    renderComponent(
      <>
        <LoadingPanel />
        <JoinCommunity />
        <CreateCommunity />
        <Channel />
      </>,
      store
    )

    const channelName = await screen.findByText('#general')

    const joinCommunityDictionary = JoinCommunityDictionary()
    const joinCommunityTitle = screen.queryByText(joinCommunityDictionary.header)

    const createCommunityDictionary = CreateCommunityDictionary()
    const createCommunityTitle = screen.queryByText(createCommunityDictionary.header)

    const startAppLoadingText = screen.queryByText(LoadingMessages.StartApp)

    expect(channelName).toBeVisible()

    expect(startAppLoadingText).toBeNull()
    expect(joinCommunityTitle).toBeNull()
    expect(createCommunityTitle).toBeNull()
  })
})
