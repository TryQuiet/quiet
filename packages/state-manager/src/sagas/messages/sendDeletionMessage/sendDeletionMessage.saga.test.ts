import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory, MessageType, PublicChannel, WriteMessagePayload } from '../../..'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { Identity } from '../../identity/identity.types'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { sendDeletionMessageSaga } from './sendDeletionMessage.saga'
import { generateChannelAddress } from '@quiet/common'

describe('sendDeletionMessage', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity

  let generalChannel: PublicChannel
  let photoChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getFactory(store)

    community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    owner = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    generalChannel = publicChannelsSelectors.currentChannel(store.getState())

    photoChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: 'photo',
            description: 'Welcome to #photo',
            timestamp: DateTime.utc().valueOf(),
            owner: owner.nickname,
            address: generateChannelAddress('photo')
          }
        }
      )
    ).channel
  })

  test('send message after deletion standard channel', async () => {
    const channelAddress = photoChannel.address
    const message = `@${owner.nickname} deleted #${channelAddress}`
    const messagePayload: WriteMessagePayload = {
      type: MessageType.Info,
      message,
      channelAddress: 'general'
    }
    const reducer = combineReducers(reducers)
    await expectSaga(
      sendDeletionMessageSaga,
      messagesActions.sendDeletionMessage({
        channelAddress
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(messagesActions.sendMessage(messagePayload))
      .run()
  })

  test('not send message after deletion general channel', async () => {
    const channelAddress = 'general'

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendDeletionMessageSaga,
      messagesActions.sendDeletionMessage({
        channelAddress
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .run()
  })
})
