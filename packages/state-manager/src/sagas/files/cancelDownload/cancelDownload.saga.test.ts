import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getReduxStoreFactory } from '../../..'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { type FactoryGirl } from 'factory-girl'
import { filesActions } from '../files.slice'
import { cancelDownloadSaga } from './cancelDownload.saga'
import { type CancelDownload, type Community, DownloadState, type Identity, SocketActions } from '@quiet/types'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { getSocketFactory } from '../../../utils/tests/factories'

describe('cancelDownloadSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let socket: MockedSocket

  let community: Community
  let alice: Identity

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })
  })

  beforeEach(async () => {
    const socketPayloadFactory = await getSocketFactory()
    socket = new MockedSocket()
  })

  test('canceling download', async () => {
    const peerId = alice.networkInfo.peerId.id

    const mid = 'mid'
    const cid = 'cid'

    const cancelDownload: CancelDownload = {
      mid,
      cid,
    }

    const reducer = combineReducers(testReducers)
    await expectSaga(cancelDownloadSaga, socket as unknown as Socket, filesActions.cancelDownload(cancelDownload))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        filesActions.updateDownloadStatus({
          mid,
          cid,
          downloadState: DownloadState.Canceling,
        })
      )
      .apply(socket, socket.emit, [
        SocketActions.CANCEL_DOWNLOAD,
        {
          peerId,
          mid,
        },
      ])
      .run()
  })
})
