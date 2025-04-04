import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type FactoryGirl } from 'factory-girl'
import { generateChannelId, createdChannelMessage, userJoinedMessage, verifyUserInfoMessage } from '@quiet/common'
import { DateTime } from 'luxon'
import {
  type Community,
  type Identity,
  MessageType,
  type PublicChannel,
  MessagesLoadedPayload,
  UserProfile,
  User,
} from '@quiet/types'
import { verifyMessagesSaga } from './verifyMessages.saga'
import { messagesActions } from '../messages.slice'
import { getBaseTypesFactory, getReduxStoreFactory } from '../../../utils/tests/factories'
import { createLogger } from '../../../utils/logger'
import { usersSelectors } from '../../users/users.selectors'
import { userProfileSelectors } from '../../users/userProfile/userProfile.selectors'

const logger = createLogger('verifyMessagesSaga-test')

describe('verifyMessage saga test', () => {
  let store: Store
  let factory: FactoryGirl
  let baseTypes: FactoryGirl

  let community: Community
  let owner: Identity

  let ownerProfile: UserProfile
  let bobProfile: UserProfile

  let generalChannel: PublicChannel
  let sportChannel: PublicChannel

  beforeAll(async () => {
    store = prepareStore().store

    factory = await getReduxStoreFactory(store)
    baseTypes = await getBaseTypesFactory()

    logger.info('create community')
    community = await factory.create('Community')

    logger.info('create owner identity')
    owner = await factory.create('Identity', {
      communityId: community.id,
    })

    ownerProfile = await factory.create('UserProfile', {
      userId: owner.userId,
      nickname: 'alice',
    })

    bobProfile = await factory.create('UserProfile', {
      nickname: 'bob',
    })

    logger.info('create general channel')
    generalChannel = (
      await factory.create('PublicChannel', {
        channel: {
          name: 'general',
          description: 'Welcome to #general',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.userId,
          id: generateChannelId('general'),
        },
      })
    ).channel

    logger.info('create sport channel')
    sportChannel = (
      await factory.create('PublicChannel', {
        channel: {
          name: 'sport',
          description: 'Welcome to #sport',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.userId,
          id: generateChannelId('sport'),
        },
      })
    ).channel
  })

  it('verify standard message ', async () => {
    logger.info('verify standard message')
    const action = await factory.build('AddMessages', {
      messages: [
        await baseTypes.build('ChannelMessage', {
          userId: owner.userId,
          channelId: generalChannel.id,
          type: MessageType.Basic,
        }),
      ],
      isVerified: true,
    })

    logger.info('payload', action)
    await expectSaga(verifyMessagesSaga, messagesActions.addMessages(action.payload))
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .not.call(verifyUserInfoMessage)
      .put(
        messagesActions.addMessageVerificationStatus({
          id: action.payload.messages[0].id,
          isVerified: true,
        })
      )
      .run()
  })

  // it('verify standard message - fail', async () => {
  //   logger.info('verify standard message')
  //   const action = await factory.build('AddMessages', {
  //     messages: [
  //       await baseTypes.build('ChannelMessage', {
  //         userId: owner.userId,
  //         channelId: generalChannel.id,
  //         type: MessageType.Basic,
  //       }),
  //     ],
  //     isVerified: false,
  //   })

  //   await expectSaga(verifyMessagesSaga, messagesActions.addMessages(action.payload))
  //     .withReducer(combineReducers(testReducers))
  //     .withState(store.getState())
  //     .not.call(verifyUserInfoMessage)
  //     .put(
  //       messagesActions.addMessageVerificationStatus({
  //         id: action.payload.messages[0].id,
  //         isVerified: false,
  //       })
  //     )
  //     .run()
  // })

  // it('verify info message from owner on general', async () => {
  //   const action = await factory.build('AddMessages', {
  //     messages: [
  //       await baseTypes.build('ChannelMessage', {
  //         userId: owner.userId,
  //         channelId: generalChannel.id,
  //         type: MessageType.Info,
  //         message: userJoinedMessage(ownerProfile.nickname),
  //       }),
  //     ],
  //     isVerified: true,
  //   })
  //   const reducer = combineReducers(testReducers)
  //   await expectSaga(verifyMessagesSaga, messagesActions.addMessages(action.payload))
  //     .withReducer(reducer)
  //     .withState(store.getState())
  //     .call(verifyUserInfoMessage, ownerProfile.nickname, { ...generalChannel, messages: { ids: [], entities: {} } })
  //     .put(
  //       messagesActions.addMessageVerificationStatus({
  //         id: action.payload.messages[0].id,
  //         isVerified: true,
  //       })
  //     )
  //     .run()
  // })

  // it('verify info message from user on general - fail', async () => {
  //   const action = await factory.build('AddMessages', {
  //     messages: [
  //       await baseTypes.build('ChannelMessage', {
  //         userId: bobProfile.userId,
  //         channelId: generalChannel.id,
  //         type: MessageType.Info,
  //         message: 'fake info message',
  //       }),
  //     ],
  //     isVerified: true,
  //   })

  //   const reducer = combineReducers(testReducers)
  //   await expectSaga(verifyMessagesSaga, messagesActions.addMessages(action.payload))
  //     .withReducer(reducer)
  //     .withState(store.getState())
  //     .call(verifyUserInfoMessage, bobProfile.nickname, { ...generalChannel, messages: { ids: [], entities: {} } })
  //     .put(
  //       messagesActions.addMessageVerificationStatus({
  //         id: action.payload.messages[0].id,
  //         isVerified: false,
  //       })
  //     )
  //     .run()
  // })

  // it('verify info message from user on general - success', async () => {
  //   const action = await factory.build('AddMessages', {
  //     messages: [
  //       await baseTypes.build('ChannelMessage', {
  //         userId: bobProfile.userId,
  //         channelId: generalChannel.id,
  //         type: MessageType.Info,
  //         message: userJoinedMessage(bobProfile.nickname),
  //       }),
  //     ],
  //     isVerified: true,
  //   })

  //   const reducer = combineReducers(testReducers)
  //   await expectSaga(verifyMessagesSaga, messagesActions.addMessages(action.payload))
  //     .withReducer(reducer)
  //     .withState(store.getState())
  //     .call(verifyUserInfoMessage, bobProfile.nickname, { ...generalChannel, messages: { ids: [], entities: {} } })
  //     .put(
  //       messagesActions.addMessageVerificationStatus({
  //         id: action.payload.messages[0].id,
  //         isVerified: true,
  //       })
  //     )
  //     .run()
  // })

  // it('verify info message from user on other channel - fail', async () => {
  //   const action = await factory.build('AddMessages', {
  //     messages: [
  //       await baseTypes.build('ChannelMessage', {
  //         userId: bobProfile.userId,
  //         channelId: sportChannel.id,
  //         type: MessageType.Info,
  //         message: 'not a valid info message',
  //       }),
  //     ],
  //     isVerified: true,
  //   })

  //   const reducer = combineReducers(testReducers)
  //   await expectSaga(verifyMessagesSaga, messagesActions.addMessages(action.payload))
  //     .withReducer(reducer)
  //     .withState(store.getState())
  //     .call(verifyUserInfoMessage, bobProfile.nickname, { ...sportChannel, messages: { ids: [], entities: {} } })
  //     .not.put(
  //       messagesActions.addMessageVerificationStatus({
  //         id: action.payload.messages[0].id,
  //         isVerified: true,
  //       })
  //     )
  //     .put(
  //       messagesActions.addMessageVerificationStatus({
  //         id: action.payload.messages[0].id,
  //         isVerified: false,
  //       })
  //     )
  //     .run()
  // })

  it('verify info message from user on other channel - success', async () => {
    const action = await factory.build('AddMessages', {
      messages: [
        await baseTypes.build('ChannelMessage', {
          userId: bobProfile.userId,
          channelId: sportChannel.id,
          type: MessageType.Info,
          message: createdChannelMessage(sportChannel.name),
        }),
      ],
      isVerified: true,
    })

    const reducer = combineReducers(testReducers)
    await expectSaga(verifyMessagesSaga, messagesActions.addMessages(action.payload))
      .withReducer(reducer)
      .withState(store.getState())
      .call(verifyUserInfoMessage, bobProfile.nickname, { ...sportChannel, messages: { ids: [], entities: {} } })
      .put(
        messagesActions.addMessageVerificationStatus({
          id: action.payload.messages[0].id,
          isVerified: true,
        })
      )
      .run()
  })
})
