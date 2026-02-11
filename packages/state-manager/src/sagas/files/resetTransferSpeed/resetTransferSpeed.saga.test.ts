import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type communitiesActions } from '../../communities/communities.slice'
import { type FactoryGirl } from 'factory-girl'
import { resetTransferSpeedSaga } from './resetTransferSpeed.saga'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { filesActions } from '../files.slice'
import { networkActions } from '../../network/network.slice'
import { type Community, DownloadState, type FileMetadata, type Identity, MessageType, Channel } from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { getReduxStoreFactory } from '../../../utils/tests/factories'

describe('downloadFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let generalChannel: Channel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })
  })

  test('reset transfer speed for files with existing transfer speed', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const id = Math.random().toString(36).substr(2.9)
    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'bot',
      ext: 'zip',
      message: {
        id,
        channelId: generalChannel.id,
      },
    }

    const message = Math.random().toString(36).substr(2.9)

    await factory.create('TestMessage', {
      identity: alice,
      message: {
        id: message,
        type: MessageType.File,
        message: '',
        createdAt: DateTime.utc().valueOf(),
        channelId: generalChannel.id,
        signature: '',
        pubKey: '',
        media,
      },
    })

    store.dispatch(
      filesActions.updateDownloadStatus({
        mid: media.message.id,
        cid: media.cid,
        downloadState: DownloadState.Downloading,
        downloadProgress: {
          size: 2048,
          downloaded: 512,
          transferSpeed: 128,
        },
      })
    )

    const reducer = combineReducers(testReducers)
    await expectSaga(resetTransferSpeedSaga, networkActions.addInitializedCommunity(community.id))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        filesActions.updateDownloadStatus({
          mid: media.message.id,
          cid: media.cid,
          downloadState: DownloadState.Downloading,
          downloadProgress: {
            size: 2048,
            downloaded: 512,
            transferSpeed: 0,
          },
        })
      )
      .run()
  })

  test('do not reset transfer speed for files without existing transfer speed', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const id = Math.random().toString(36).substr(2.9)
    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'bot',
      ext: 'zip',
      message: {
        id,
        channelId: generalChannel.id,
      },
    }

    const message = Math.random().toString(36).substr(2.9)

    await factory.create('TestMessage', {
      identity: alice,
      message: {
        id: message,
        type: MessageType.File,
        message: '',
        createdAt: DateTime.utc().valueOf(),
        channelId: generalChannel.id,
        signature: '',
        pubKey: '',
        media,
      },
    })

    store.dispatch(
      filesActions.updateDownloadStatus({
        mid: media.message.id,
        cid: media.cid,
        downloadState: DownloadState.Downloading,
      })
    )

    const reducer = combineReducers(testReducers)
    await expectSaga(resetTransferSpeedSaga, networkActions.addInitializedCommunity(community.id))
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        filesActions.updateDownloadStatus({
          mid: media.message.id,
          cid: media.cid,
          downloadState: DownloadState.Downloading,
          downloadProgress: {
            size: 2048,
            downloaded: 512,
            transferSpeed: 0,
          },
        })
      )
      .run()
  })

  test('do not reset transfer speed for files with download state other than downloading', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const id = Math.random().toString(36).substr(2.9)
    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'bot',
      ext: 'zip',
      message: {
        id,
        channelId: generalChannel.id,
      },
    }

    const message = Math.random().toString(36).substr(2.9)

    await factory.create('TestMessage', {
      identity: alice,
      message: {
        id: message,
        type: MessageType.File,
        message: '',
        createdAt: DateTime.utc().valueOf(),
        channelId: generalChannel.id,
        signature: '',
        pubKey: '',
        media,
      },
    })

    store.dispatch(
      filesActions.updateDownloadStatus({
        mid: media.message.id,
        cid: media.cid,
        downloadState: DownloadState.Canceling,
        downloadProgress: {
          size: 2048,
          downloaded: 512,
          transferSpeed: 0,
        },
      })
    )

    const reducer = combineReducers(testReducers)
    await expectSaga(resetTransferSpeedSaga, networkActions.addInitializedCommunity(community.id))
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        filesActions.updateDownloadStatus({
          mid: media.message.id,
          cid: media.cid,
          downloadState: DownloadState.Canceling,
          downloadProgress: {
            size: 2048,
            downloaded: 512,
            transferSpeed: 0,
          },
        })
      )
      .run()
  })
})
