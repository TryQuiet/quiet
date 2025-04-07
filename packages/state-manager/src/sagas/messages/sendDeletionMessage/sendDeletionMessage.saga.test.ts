import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory } from '../../..'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { type communitiesActions } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { messagesActions } from '../../messages/messages.slice'
import { type publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { sendDeletionMessageSaga } from './sendDeletionMessage.saga'
import { generateChannelId } from '@quiet/common'
import {
  type Community,
  type Identity,
  MessageType,
  type PublicChannel,
  UserProfile,
  type WriteMessagePayload,
} from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

describe('sendDeletionMessage', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity
  let ownerProfile: UserProfile

  let photoChannel: PublicChannel
  let generalChannel: PublicChannel

  let message: string
  let messagePayload: WriteMessagePayload

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getReduxStoreFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    owner = await factory.create('Identity', {
      communityId: community.id,
      userId: 'ownerUserId',
    })
    ownerProfile = await factory.create('UserProfile', {
      userId: owner.userId,
    })

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    photoChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'photo',
          description: 'Welcome to #photo',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.userId,
          id: generateChannelId('photo'),
        },
      })
    ).channel
    message = `@${ownerProfile.nickname} deleted #${photoChannel.name}`
    messagePayload = {
      type: MessageType.Info,
      message,
      channelId: generalChannel.id,
    }
  })

  test('send message after deletion standard channel', async () => {
    const channelId = photoChannel.id

    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendDeletionMessageSaga,
      messagesActions.sendDeletionMessage({
        channelId,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(messagesActions.sendMessage(messagePayload))
      .run()
  })

  test('not send message after deletion general channel', async () => {
    const channelId = 'general'

    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendDeletionMessageSaga,
      messagesActions.sendDeletionMessage({
        channelId,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(messagesActions.sendMessage(messagePayload))
      .run()
  })
})
