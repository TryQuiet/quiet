import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from 'socket.io-client'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { type FactoryGirl } from 'factory-girl'
import { filesActions } from '../files.slice'
import { cancelDownloadSaga } from './cancelDownload.saga'
import { type CancelDownload, type Community, DownloadState, type Identity, SocketActionTypes } from '@quiet/types'

describe('cancelDownloadSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })
  })

  test('uploading file', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const peerId = alice.peerId.id

    const mid = 'mid'
    const cid = 'cid'

    const cancelDownload: CancelDownload = {
      mid,
      cid,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(cancelDownloadSaga, socket, filesActions.cancelDownload(cancelDownload))
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
        SocketActionTypes.CANCEL_DOWNLOAD,
        {
          peerId,
          mid,
        },
      ])
      .run()
  })
})
