import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import { renderComponent } from '../../../testUtils/renderComponent'
import { prepareStore } from '../../../testUtils/prepareStore'
import { StoreKeys } from '../../../store/store.keys'
import { getFactory } from '@zbayapp/nectar'
import { SocketState } from '../../../sagas/socket/socket.slice'
import LoadingPanel from './loadingPanel'
import JoinCommunity from '../joinCommunity/joinCommunity'
import CreateCommunity from '../createCommunity/createCommunity'
import Channel from '../../pages/Channel'
import {
  CreateCommunityDictionary,
  JoinCommunityDictionary
} from '../../../components/widgets/performCommunityAction/PerformCommunityAction.dictionary'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../../../../shared/setupTests'
import { communitiesActions } from '@zbayapp/nectar/lib/sagas/communities/communities.slice'
import { identityActions } from '@zbayapp/nectar/lib/sagas/identity/identity.slice'

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
          isConnected: true
        }
      },
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      zbayNickname: 'holmes'
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

    const joinDictionary = JoinCommunityDictionary()
    const joinCommunityTitle = screen.queryByText(joinDictionary.header)

    const createDictionary = CreateCommunityDictionary()
    const createCommunityTitle = screen.queryByText(createDictionary.header)

    expect(channelName).toBeVisible()
    expect(joinCommunityTitle).toBeNull()
    expect(createCommunityTitle).toBeNull()
  })
})
