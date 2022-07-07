import {
  setupCrypto
} from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { downloadFileSaga } from './downloadFileSaga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { FactoryGirl } from 'factory-girl'
import { DownloadState, FileMetadata } from '../../files/files.types'
import { filesActions } from '../files.slice'

describe('downloadFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let message: string

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

    message = Math.random().toString(36).substr(2.9)
  })

  test('downloading file', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'name',
      ext: 'ext',
      message: {
        id: message,
        channelAddress: 'general'
      }
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      downloadFileSaga,
      socket,
      filesActions.downloadFile(media)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(filesActions.updateDownloadStatus({
        cid: 'cid',
        downloadState: DownloadState.Queued,
        downloadProgress: undefined
      }))
      .apply(socket, socket.emit, [
        SocketActionTypes.UPLOAD_FILE,
        {
          peerId: alice.peerId.id,
          file: media
        }
      ])
      .run()
  })
})
