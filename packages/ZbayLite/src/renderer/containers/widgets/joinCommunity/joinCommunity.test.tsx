import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { apply, take } from 'typed-redux-saga'
import { renderComponent } from '../../../testUtils/renderComponent'
import { prepareStore } from '../../../testUtils/prepareStore'
import { StoreKeys } from '../../../store/store.keys'
import { communities, getFactory, identity } from '@zbayapp/nectar'
import { SocketState } from '../../../sagas/socket/socket.slice'
import { ModalsInitialState } from '../../../sagas/modals/modals.slice'
import JoinCommunity from './joinCommunity'
import CreateUsernameModal from '../createUsernameModal/CreateUsername'
import { ModalName } from '../../../sagas/modals/modals.types'
import { JoinCommunityDictionary } from '../../../components/widgets/performCommunityAction/PerformCommunityAction.dictionary'
import MockedSocket from 'socket.io-mock'
import { act } from 'react-dom/test-utils'
import { ioMock } from '../../../../shared/setupTests'
import { SocketActionTypes } from '@zbayapp/nectar/lib/sagas/socket/const/actionTypes'
import { socketEventData } from '../../../testUtils/socket'
import { identityActions } from '@zbayapp/nectar/lib/sagas/identity/identity.slice'

describe('User', () => {
  let socket: MockedSocket
  let communityId: string

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('joins community and registers username', async () => {
    const { store, runSaga } = await prepareStore(
      {
        [StoreKeys.Socket]: {
          ...new SocketState(),
          isConnected: false
        },
        [StoreKeys.Modals]: {
          ...new ModalsInitialState(),
          [ModalName.joinCommunityModal]: { open: true }
        }
      },
      socket // Fork Nectar's sagas
    )

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsernameModal />
      </>,
      store
    )

    const factory = await getFactory(store)

    jest
      .spyOn(socket, 'emit')
      .mockImplementation(async (action: SocketActionTypes, ...input: any[]) => {
        if (action === SocketActionTypes.CREATE_NETWORK) {
          const data = input as socketEventData<[string]>
          communityId = data[0]
          const holmes = (
            await factory.build<typeof identityActions.addNewIdentity>('Identity', {
              id: communityId,
              zbayNickname: 'holmes'
            })
          ).payload
          return socket.socketClient.emit(SocketActionTypes.NEW_COMMUNITY, {
            id: communityId,
            payload: holmes
          })
        }
        if (action === SocketActionTypes.REGISTER_USER_CERTIFICATE) {
          const data = input as socketEventData<[string, string, string]>
          const communityId = data[2]
          return socket.socketClient.emit(SocketActionTypes.SEND_USER_CERTIFICATE, {
            id: communityId,
            payload: {
              certificate:
                'MIIBTDCB8wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowEjEQMA4GA1UEAxMHWmJheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABEaV1l/7BOvPh0fFteSubIJ2r66YM4XoMMEfUhHiJE6O0ojfHdNrsItg+pHmpIQyEe+3YGWxIhgjL65+liE8ypqjPzA9MA8GA1UdEwQIMAYBAf8CAQMwCwYDVR0PBAQDAgCGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAKBggqhkjOPQQDAgNIADBFAiARHtkv7GlhfkFbtRGU1r19UJFkhA7Vu+EubBnJPjD9/QIhALje1S3bp8w8jjVf70jGc2/uRmDCo/bNyQRpApBaD5vY'
            }
          })
        }
      })

    // Confirm proper modal title is displayed
    const dictionary = JoinCommunityDictionary()
    const joinCommunityTitle = screen.getByText(dictionary.header)
    expect(joinCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const joinCommunityInput = screen.getByPlaceholderText(dictionary.placeholder)
    const joinCommunityButton = screen.getByText(dictionary.button)
    userEvent.type(joinCommunityInput, '3lyn5yjwwb74he5olv43eej7knt34folvrgrfsw6vzitvkxmc5wpe4yd')
    userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = await screen.findByPlaceholderText('Enter a username')
    const createUsernameButton = await screen.findByText('Register')
    userEvent.type(createUsernameInput, 'holmes')
    userEvent.click(createUsernameButton)

    await act(async () => {
      await runSaga(testJoinCommunitySaga).toPromise()
      await runSaga(mockChannelsResponse).toPromise()
    })

    expect(createUsernameTitle).not.toBeVisible()
    expect(joinCommunityTitle).not.toBeVisible()

    function* testJoinCommunitySaga(): Generator {
      yield* take(communities.actions.joinCommunity)
      yield* take(communities.actions.responseCreateCommunity)
      yield* take(identity.actions.registerUsername)
      yield* take(identity.actions.storeUserCertificate)
    }

    function* mockChannelsResponse(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS,
        {
          communityId: communityId,
          channels: {
            general: {
              name: 'general',
              description: 'string',
              owner: 'owner',
              timestamp: 0,
              address: 'string'
            }
          }
        }
      ])
    }
  })
})
