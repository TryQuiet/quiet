import {
  setupCrypto
} from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, PublicChannel } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { downloadFileSaga } from './downloadFileSaga'
import { FactoryGirl } from 'factory-girl'
import { filesActions } from '../files.slice'
import { Community, DownloadState, FileMetadata, Identity, SocketActionTypes } from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
 
describe('downloadFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let message: string

  let generalChannel: PublicChannel

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

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()
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
        channelId: generalChannel.id
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
        mid: message,
        cid: 'cid',
        downloadState: DownloadState.Queued
      }))
      .apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: media
        }
      ])
      .run()
  })
})
