import { setupCrypto, pubKeyFromCsr } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { type FactoryGirl } from 'factory-girl'
import { generateChannelId, createdChannelMessage, userJoinedMessage, verifyUserInfoMessage } from '@quiet/common'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import {
  type Community,
  type Identity,
  MessageType,
  type PublicChannel,
  ChannelMessage,
  IncomingMessages,
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
  let sportChannel: PublicChannel

  let bobCsr: string
  let aliceCsr: string

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    aliceCsr = alice.userCsr?.userCsr || ''

    store.dispatch(
      communitiesActions.updateCommunityData({
        id: community.id,
        // null/undefined type mismatch here. Might make things easier
        // to make it consistent.
        ownerCertificate: alice.userCertificate || undefined,
      })
    )

    bob = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'bob',
    })

    bobCsr = bob.userCsr?.userCsr || ''

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

    sportChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'sport',
          description: 'Welcome to #sport',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          id: generateChannelId('sport'),
        },
      })
    ).channel
  })

  it('verify standard message ', async () => {
    const message: ChannelMessage = {
      id: 'id1',
      type: MessageType.Basic,
      message: 'message',
      createdAt: 24,
      channelId: generalChannel.id,
      signature: 'signature',
      pubKey: pubKeyFromCsr(aliceCsr),
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
      .not.call(verifyUserInfoMessage)
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
    const message: ChannelMessage = {
      id: 'id1',
      type: MessageType.Info,
      message: 'message',
      createdAt: 24,
      channelId: generalChannel.id,
      signature: 'signature',
      pubKey: pubKeyFromCsr(aliceCsr),
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
      .not.call(verifyUserInfoMessage)
      .put(
        messagesActions.addMessageVerificationStatus({
          publicKey: message.pubKey,
          signature: message.signature,
          isVerified: true,
        })
      )
      .run()
  })

  it('verify info message from user on general - fail', async () => {
    const message: ChannelMessage = {
      id: 'id1',
      type: MessageType.Info,
      message: 'message',
      createdAt: 24,
      channelId: generalChannel.id,
      signature: 'signature',
      pubKey: pubKeyFromCsr(bobCsr),
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
      .call(verifyUserInfoMessage, 'bob', {
        ...generalChannel,
        messages: { ids: [], entities: {} },
      })
      .not.put(
        messagesActions.addMessageVerificationStatus({
          publicKey: message.pubKey,
          signature: message.signature,
          isVerified: true,
        })
      )
      .run()
  })

  it('verify info message from user on general - success', async () => {
    const message: ChannelMessage = {
      id: 'id1',
      type: MessageType.Info,
      message: userJoinedMessage(bob.nickname),
      createdAt: 24,
      channelId: generalChannel.id,
      signature: 'signature',
      pubKey: pubKeyFromCsr(bobCsr),
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
      .call(verifyUserInfoMessage, 'bob', {
        ...generalChannel,
        messages: { ids: [], entities: {} },
      })
      .put(
        messagesActions.addMessageVerificationStatus({
          publicKey: message.pubKey,
          signature: message.signature,
          isVerified: true,
        })
      )
      .run()
  })

  it('verify info message from user on other channel - fail', async () => {
    const message: ChannelMessage = {
      id: 'id1',
      type: MessageType.Info,
      message: 'message',
      createdAt: 24,
      channelId: sportChannel.id,
      signature: 'signature',
      pubKey: pubKeyFromCsr(bobCsr),
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
      .call(verifyUserInfoMessage, 'bob', {
        ...sportChannel,
        messages: { ids: [], entities: {} },
      })
      .not.put(
        messagesActions.addMessageVerificationStatus({
          publicKey: message.pubKey,
          signature: message.signature,
          isVerified: true,
        })
      )
      .run()
  })

  it('verify info message from user on other channel - success', async () => {
    const message: ChannelMessage = {
      id: 'id1',
      type: MessageType.Info,
      message: createdChannelMessage(sportChannel.name),
      createdAt: 24,
      channelId: sportChannel.id,
      signature: 'signature',
      pubKey: pubKeyFromCsr(bobCsr),
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
      .call(verifyUserInfoMessage, 'bob', {
        ...sportChannel,
        messages: { ids: [], entities: {} },
      })
      .put(
        messagesActions.addMessageVerificationStatus({
          publicKey: message.pubKey,
          signature: message.signature,
          isVerified: true,
        })
      )
      .run()
  })
})
