import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { messagesActions } from '../../messages/messages.slice'
import { FactoryGirl } from 'factory-girl'
import { downloadedFileSaga } from './downloadedFile.saga'
import { currentChannelAddress } from '../../publicChannels/publicChannels.selectors'
import { ChannelMessage, PublicChannel } from '../../publicChannels/publicChannels.types'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { FileMetadata } from '../files.types'

describe('downloadedFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: PublicChannel

  let message: ChannelMessage

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
          communityId: alice.id,
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

    message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice
        }
      )
    ).message
  })

  test('update message after downloading file', async () => {
    const currentChannel = currentChannelAddress(store.getState())

    const payload: FileMetadata = {
      cid: 'cid',
      path: 'dir/image.png',
      name: 'image',
      ext: 'png',
      message: {
        id: message.id,
        channelAddress: currentChannel
      }
    }

    const reducer = combineReducers(reducers)
    await expectSaga(downloadedFileSaga, messagesActions.downloadedFile(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.incomingMessages({
          messages: [
            {
              ...message,
              media: payload
            }
          ],
          communityId: community.id
        })
      )
      .run()
  })
})
