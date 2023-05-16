import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { FactoryGirl } from 'factory-girl'
import { CancelDownload, DownloadState } from '../../files/files.types'
import { filesActions } from '../files.slice'
import { cancelDownloadSaga } from './cancelDownload.saga'
import { Community } from '@quiet/types'

describe('cancelDownloadSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )
  })

  test('uploading file', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const peerId = alice.peerId.id

    const mid = 'mid'
    const cid = 'cid'

    const cancelDownload: CancelDownload = {
      mid: mid,
      cid: cid
    }

    const reducer = combineReducers(reducers)
    await expectSaga(cancelDownloadSaga, socket, filesActions.cancelDownload(cancelDownload))
      .withReducer(reducer)
      .withState(store.getState())
      .put(filesActions.updateDownloadStatus({
        mid: mid,
        cid: cid,
        downloadState: DownloadState.Canceling
      }))
      .apply(socket, socket.emit, [
        SocketActionTypes.CANCEL_DOWNLOAD,
        {
          peerId,
          mid
        }
      ])
      .run()
  })
})
