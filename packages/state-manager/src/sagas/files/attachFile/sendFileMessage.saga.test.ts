import { setupCrypto } from '@quiet/identity'
import { call } from 'redux-saga-test-plan/matchers'
import { type Store } from '../../store.types'
import { getReduxStoreFactory } from '../../..'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { sendFileMessageSaga } from './sendFileMessage.saga'
import { type FactoryGirl } from 'factory-girl'
import { type publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { filesActions } from '../files.slice'
import { generateMessageId } from '../../messages/utils/message.utils'
import { DateTime } from 'luxon'
import { messagesActions } from '../../messages/messages.slice'
import {
  type Community,
  DownloadState,
  type FileMetadata,
  type Identity,
  type PublicChannel,
  MessageType,
} from '@quiet/types'
import { generateTestChannelId } from '@quiet/common'
import { currentChannelId } from '../../publicChannels/publicChannels.selectors'

describe('sendFileMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: PublicChannel

  let message: string

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create('Identity', {
      communityId: community.id,
    })

    sailingChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.userId,
          id: generateTestChannelId('sailing'),
        },
      })
    ).channel!

    message = Math.random().toString(36).substr(2.9)
  })

  test('saves message with media', async () => {
    const currentChannel = currentChannelId(store.getState())

    if (!currentChannel) throw new Error('no current channel id')

    const media: FileMetadata = {
      cid: `attaching_${message}`,
      path: 'temp/name.ext',
      name: 'name',
      ext: 'ext',
      message: {
        id: message,
        channelId: currentChannel,
      },
      tmpPath: undefined,
    }
    const reducer = combineReducers(testReducers)
    await expectSaga(sendFileMessageSaga, filesActions.attachFile(media))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(generateMessageId), message]])
      .put(
        messagesActions.sendMessage({
          id: message,
          message: '',
          type: MessageType.File,
          media,
        })
      )
      .put(
        filesActions.updateDownloadStatus({
          mid: message,
          cid: `attaching_${message}`,
          downloadState: DownloadState.Attaching,
          downloadProgress: undefined,
        })
      )
      .run()
  })

  test('saves message with media with updated path', async () => {
    const currentChannel = currentChannelId(store.getState())

    if (!currentChannel) throw new Error('no current channel id')

    const media: FileMetadata = {
      cid: `attaching_${message}`,
      path: 'file://temp/name.ext',
      tmpPath: 'file://temp/name.ext',
      name: 'name',
      ext: 'ext',
      message: {
        id: message,
        channelId: currentChannel,
      },
    }
    const updatedMedia: FileMetadata = {
      ...media,
      path: 'temp/name.ext',
      tmpPath: 'temp/name.ext',
    }

    const reducer = combineReducers(testReducers)
    await expectSaga(sendFileMessageSaga, filesActions.attachFile(media))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(generateMessageId), message]])
      .put(
        messagesActions.sendMessage({
          id: message,
          message: '',
          type: MessageType.File,
          media: updatedMedia,
        })
      )
      .put(
        filesActions.updateDownloadStatus({
          mid: message,
          cid: `attaching_${message}`,
          downloadState: DownloadState.Attaching,
          downloadProgress: undefined,
        })
      )
      .run()
  })
})
