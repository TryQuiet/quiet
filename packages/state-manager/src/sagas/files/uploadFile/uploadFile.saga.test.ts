import {
  setupCrypto
} from '@quiet/identity'
import { call } from 'redux-saga-test-plan/matchers'
import { Store } from '../../store.types'
import { getFactory, MessageType } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { uploadFileSaga } from './uploadFile.saga'
import { FactoryGirl } from 'factory-girl'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { currentChannelAddress } from '../../publicChannels/publicChannels.selectors'
import { filesActions } from '../files.slice'
import { generateMessageId } from '../../messages/utils/message.utils'
import { DateTime } from 'luxon'
import { messagesActions } from '../../messages/messages.slice'
import { Community, DownloadState, FileMetadata, Identity, PublicChannel, SocketActionTypes } from '@quiet/types'

describe('uploadFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: PublicChannel

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

    sailingChannel = (await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
      'PublicChannel',
      {
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          address: 'sailing'
        }
      }
    )).channel

    message = Math.random().toString(36).substr(2.9)
  })

  test('uploading file', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const currentChannel = currentChannelAddress(store.getState())

    const peerId = alice.peerId.id

    const media: FileMetadata = {
      cid: `uploading_${message}`,
      path: 'temp/name.ext',
      name: 'name',
      ext: 'ext',
      message: {
        id: message,
        channelAddress: currentChannel
      }
    }
    const reducer = combineReducers(reducers)
    await expectSaga(
      uploadFileSaga,
      socket,
      filesActions.uploadFile(media)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), message]
      ])
      .put(messagesActions.sendMessage({
        id: message,
        message: '',
        type: MessageType.File,
        media: media
      }))
      .put(filesActions.updateDownloadStatus({
        mid: message,
        cid: `uploading_${message}`,
        downloadState: DownloadState.Uploading,
        downloadProgress: undefined
      }))
      .apply(socket, socket.emit, [
        SocketActionTypes.UPLOAD_FILE,
        {
          file: media,
          peerId
        }
      ])
      .run()
  })
})
