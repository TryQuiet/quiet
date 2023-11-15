import { setupCrypto, pubKeyFromCsr } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { type FactoryGirl } from 'factory-girl'
import { generateChannelId } from '@quiet/common'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import {
  type Community,
  type Identity,
  MessageType,
  type PublicChannel,
  ChannelMessage,
  IncomingMessages,
  userJoinedMessage,
} from '@quiet/types'
import { verifyMessagesSaga } from './verifyMessages.saga'
import { messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'
import { usersSelectors } from '../../users/users.selectors'

describe('verifyMessage saga test', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity
  let bob: Identity

  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    bob = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'bob',
    })

    generalChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'general',
          description: 'Welcome to #general',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          id: generateChannelId('general'),
        },
      })
    ).channel
  })

  it('verify standard message ', async () => {
    if (!alice.userCsr?.userCsr) throw Error('no Alice userCsr')

    const message: ChannelMessage = {
      id: 'id1',
      type: MessageType.Basic,
      message: 'message',
      createdAt: 24,
      channelId: generalChannel.id,
      signature: 'signature',
      pubKey: pubKeyFromCsr(alice.userCsr?.userCsr),
      media: undefined,
    }

    const payload: IncomingMessages = {
      messages: [message],
      isVerified: true,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(verifyMessagesSaga, messagesActions.incomingMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .not.select(messagesSelectors.getMessagesFromChannelIdByPubKey)
      .not.select(usersSelectors.allUsers)
      .not.call(userJoinedMessage)
      .put(
        messagesActions.addMessageVerificationStatus({
          publicKey: message.pubKey,
          signature: message.signature,
          isVerified: true,
        })
      )
      .run()
  })

  it('verify info message from owner on general', async () => {
    if (!alice.userCsr?.userCsr) throw Error('no Alice userCsr')

    const message: ChannelMessage = {
      id: 'id1',
      type: MessageType.Info,
      message: 'message',
      createdAt: 24,
      channelId: generalChannel.id,
      signature: 'signature',
      pubKey: pubKeyFromCsr(alice.userCsr?.userCsr),
      media: undefined,
    }

    const payload: IncomingMessages = {
      messages: [message],
      isVerified: true,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(verifyMessagesSaga, messagesActions.incomingMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .not.call(userJoinedMessage)
      .put(
        messagesActions.addMessageVerificationStatus({
          publicKey: message.pubKey,
          signature: message.signature,
          isVerified: true,
        })
      )
      .run()
  })

  it('verify info message from user on general', async () => {
    if (!bob.userCsr?.userCsr) throw Error('no bob userCsr')

    const message: ChannelMessage = {
      id: 'id1',
      type: MessageType.Info,
      message: 'message',
      createdAt: 24,
      channelId: generalChannel.id,
      signature: 'signature',
      pubKey: pubKeyFromCsr(bob.userCsr?.userCsr),
      media: undefined,
    }

    const payload: IncomingMessages = {
      messages: [message],
      isVerified: true,
    }

    store.dispatch(messagesActions.incomingMessages({ messages: [message] }))
    const reducer = combineReducers(reducers)
    await expectSaga(verifyMessagesSaga, messagesActions.incomingMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .call(userJoinedMessage, 'bob')
      .not.put(
        messagesActions.addMessageVerificationStatus({
          publicKey: message.pubKey,
          signature: message.signature,
          isVerified: true,
        })
      )
      .run()
  })
})
