import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, MessageType, PublicChannel, publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { FactoryGirl } from 'factory-girl'
import { DownloadState, FileMetadata } from '../files.types'
import { resetTransferSpeedSaga } from './resetTransferSpeed.saga'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { connectionActions } from '../../appConnection/connection.slice'
import { filesActions } from '../files.slice'
import { networkActions } from '../../network/network.slice'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

describe('downloadFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    generalChannel = publicChannelsSelectors.generalChannel(store.getState())

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )
  })

  test('reset transfer speed for files with existing transfer speed', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: generalChannel.address
      })
    )

    const id = Math.random().toString(36).substr(2.9)
    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'bot',
      ext: 'zip',
      message: {
        id: id,
        channelAddress: generalChannel.address
      }
    }

    const message = Math.random().toString(36).substr(2.9)

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: generalChannel.address,
          signature: '',
          pubKey: '',
          media: media
        }
      }
    )

    store.dispatch(
      filesActions.updateDownloadStatus({
        mid: media.message.id,
        cid: media.cid,
        downloadState: DownloadState.Downloading,
        downloadProgress: {
          size: 2048,
          downloaded: 512,
          transferSpeed: 128
        }
      })
    )

    const reducer = combineReducers(reducers)
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
            transferSpeed: 0
          }
        })
      )
      .run()
  })

  test('do not reset transfer speed for files without existing transfer speed', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: generalChannel.address
      })
    )

    const id = Math.random().toString(36).substr(2.9)
    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'bot',
      ext: 'zip',
      message: {
        id: id,
        channelAddress: generalChannel.address
      }
    }

    const message = Math.random().toString(36).substr(2.9)

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: generalChannel.address,
          signature: '',
          pubKey: '',
          media: media
        }
      }
    )

    store.dispatch(
      filesActions.updateDownloadStatus({
        mid: media.message.id,
        cid: media.cid,
        downloadState: DownloadState.Downloading
      })
    )

    const reducer = combineReducers(reducers)
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
            transferSpeed: 0
          }
        })
      )
      .run()
  })

  test('do not reset transfer speed for files with download state other than downloading', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: generalChannel.address
      })
    )

    const id = Math.random().toString(36).substr(2.9)
    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'bot',
      ext: 'zip',
      message: {
        id: id,
        channelAddress: generalChannel.address
      }
    }

    const message = Math.random().toString(36).substr(2.9)

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: generalChannel.address,
          signature: '',
          pubKey: '',
          media: media
        }
      }
    )

    store.dispatch(
      filesActions.updateDownloadStatus({
        mid: media.message.id,
        cid: media.cid,
        downloadState: DownloadState.Canceling,
        downloadProgress: {
          size: 2048,
          downloaded: 512,
          transferSpeed: 0
        }
      })
    )

    const reducer = combineReducers(reducers)
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
            transferSpeed: 0
          }
        })
      )
      .run()
  })
})
