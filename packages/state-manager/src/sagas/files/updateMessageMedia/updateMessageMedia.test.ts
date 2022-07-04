import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, MessageType, publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { FactoryGirl } from 'factory-girl'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { filesActions } from '../files.slice'
import { FileMetadata } from '../files.types'
import { messagesActions } from '../../messages/messages.slice'
import { updateMessageMediaSaga } from './updateMessageMedia'
import { currentChannelAddress } from '../../publicChannels/publicChannels.selectors'
import { ChannelMessage, PublicChannel } from '../../publicChannels/publicChannels.types'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'

describe('downloadedFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: PublicChannel

  let message: ChannelMessage

  let metadata: FileMetadata

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

    sailingChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
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
      )
    ).channel

    const currentChannel = currentChannelAddress(store.getState())

    metadata = {
      cid: 'cid',
      path: 'dir/image.png',
      name: 'image',
      ext: 'png',
      message: {
        id: '1',
        channelAddress: currentChannel
      }
    }

    message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id: '1',
            type: MessageType.Basic,
            message: '',
            createdAt: DateTime.utc().valueOf(),
            channelAddress: currentChannel,
            signature: '',
            pubKey: '',
            media: metadata
          }
        }
      )
    ).message
  })

  test('update message media', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(updateMessageMediaSaga, filesActions.updateMessageMedia(metadata))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.incomingMessages({
          messages: [
            {
              ...message,
              media: metadata
            }
          ]
        })
      )
      .run()
  })
})
