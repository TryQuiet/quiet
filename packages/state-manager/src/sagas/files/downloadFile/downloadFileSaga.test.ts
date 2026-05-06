import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getReduxStoreFactory } from '../../..'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { downloadFileSaga } from './downloadFileSaga'
import { type FactoryGirl } from 'factory-girl'
import { filesActions } from '../files.slice'
import {
  type Community,
  DownloadState,
  type FileMetadata,
  type Identity,
  SocketActions,
  type PublicChannel,
} from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { getSocketFactory } from '../../../utils/tests/factories'

describe('downloadFileSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let socket: MockedSocket

  let community: Community
  let alice: Identity

  let message: string

  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })

    message = Math.random().toString(36).substring(2, 11)

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()
  })

  beforeEach(async () => {
    const socketPayloadFactory = await getSocketFactory()
    socket = new MockedSocket()
  })

  test('downloading file', async () => {
    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'name',
      ext: 'ext',
      message: {
        id: message,
        channelId: generalChannel.id,
      },
    }

    const reducer = combineReducers(testReducers)
    await expectSaga(downloadFileSaga, socket as unknown as Socket, filesActions.downloadFile(media))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        filesActions.updateDownloadStatus({
          mid: message,
          cid: 'cid',
          downloadState: DownloadState.Queued,
        })
      )
      .apply(socket, socket.emit, [
        SocketActions.DOWNLOAD_FILE,
        {
          peerId: alice.networkInfo.peerId.id,
          metadata: media,
        },
      ])
      .run()
  })
})
