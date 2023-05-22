import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { messagesActions } from './../messages.slice'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { checkForMessagesSaga } from './checkForMessages.saga'
import { DateTime } from 'luxon'
import { selectGeneralChannel } from '../../publicChannels/publicChannels.selectors'
import { Community, Identity, MessageType, PublicChannel } from '@quiet/types'

describe('checkForMessagesSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    // Set date display format
    process.env.LC_ALL = 'en_US.UTF-8'

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    generalChannel = {
      ...selectGeneralChannel(store.getState()),
      // @ts-ignore
      messages: undefined,
      messagesSlice: undefined
    }

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )
  })

  test('ask for missing messages', async () => {
    const message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: MessageType.Basic,
            message: 'message',
            createdAt: DateTime.utc().valueOf(),
            channelId: generalChannel.id,
            signature: '',
            pubKey: ''
          },
          verifyAutomatically: true
        }
      )
    ).message

    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMessagesSaga,
      messagesActions.responseSendMessagesIds({
        ids: [message.id, 'jf84hwwa', 'kl12sa0a'],
        channelId: generalChannel.id,
        communityId: community.id
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.askForMessages({
          peerId: alice.peerId.id,
          communityId: community.id,
          channelId: generalChannel.id,
          ids: ['jf84hwwa', 'kl12sa0a']
        })
      )
      .run()
  })
})
