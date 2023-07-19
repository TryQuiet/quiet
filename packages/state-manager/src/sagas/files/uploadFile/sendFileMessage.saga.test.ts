import { setupCrypto } from '@quiet/identity'
import { call } from 'redux-saga-test-plan/matchers'
import { type Store } from '../../store.types'
import { getFactory, MessageType } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from 'socket.io-client'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { sendFileMessageSaga } from './sendFileMessage.saga'
import { type FactoryGirl } from 'factory-girl'
import { type publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { filesActions } from '../files.slice'
import { generateMessageId } from '../../messages/utils/message.utils'
import { DateTime } from 'luxon'
import { messagesActions } from '../../messages/messages.slice'
import { type Community, DownloadState, type FileMetadata, type Identity, type PublicChannel } from '@quiet/types'
import { generateChannelId } from '@quiet/common'
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

    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    sailingChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          id: generateChannelId('sailing'),
        },
      })
    ).channel

    message = Math.random().toString(36).substr(2.9)
  })

  test('uploading file', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const currentChannel = currentChannelId(store.getState())

    if (!currentChannel) throw new Error('no current channel id')

    const peerId = alice.peerId.id

    const media: FileMetadata = {
      cid: `uploading_${message}`,
      path: 'temp/name.ext',
      name: 'name',
      ext: 'ext',
      message: {
        id: message,
        channelId: currentChannel,
      },
    }
    const reducer = combineReducers(reducers)
    await expectSaga(sendFileMessageSaga, filesActions.uploadFile(media))
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
          cid: `uploading_${message}`,
          downloadState: DownloadState.Uploading,
          downloadProgress: undefined,
        })
      )
      .run()
  })
})
