import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../..'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { type identityActions } from '../../identity/identity.slice'
import { type communitiesActions } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { messagesActions } from '../../messages/messages.slice'
import { type publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { sendDeletionMessageSaga } from './sendDeletionMessage.saga'
import { generateChannelId } from '@quiet/common'
import { type Community, type Identity, MessageType, type PublicChannel, type WriteMessagePayload } from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

describe('sendDeletionMessage', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity

  let photoChannel: PublicChannel
  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    owner = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
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
          owner: owner.nickname,
          id: generateChannelId('photo'),
        },
      })
    ).channel
  })

  test('send message after deletion standard channel', async () => {
    const channelId = photoChannel.id
    const message = `@${owner.nickname} deleted #${photoChannel.name}`
    const messagePayload: WriteMessagePayload = {
      type: MessageType.Info,
      message,
      channelId: generalChannel.id,
    }
    const reducer = combineReducers(reducers)
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

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendDeletionMessageSaga,
      messagesActions.sendDeletionMessage({
        channelId,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .run()
  })
})
