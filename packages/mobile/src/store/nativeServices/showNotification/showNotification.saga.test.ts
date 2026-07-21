import { NativeModules, Platform } from 'react-native'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { showNotificationSaga } from './showNotification.saga'
import StateManager, {
  publicChannels,
  users,
  PUSH_NOTIFICATION_CHANNEL,
  getReduxStoreFactory,
  prepareStore,
  Store,
  communities,
  identity,
  getBaseTypesFactory,
} from '@quiet/state-manager'
import { StoreKeys } from '../../store.keys'
import { initReducer, InitState } from '../../init/init.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationReducer, NavigationState } from '../../navigation/navigation.slice'
import { FactoryGirl } from 'factory-girl'
import {
  ChannelMessage,
  Community,
  FileMetadata,
  Identity,
  MarkUnreadChannelPayload,
  MessageType,
  PublicChannel,
  UserProfile,
} from '@quiet/types'
import { generateTestChannelId } from '@quiet/common'
import { DateTime } from 'luxon'

describe('showNotificationSaga', () => {
  let payload: MarkUnreadChannelPayload

  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity
  let alicesProfile: UserProfile

  let generalChannel: PublicChannel

  let photoChannel: PublicChannel

  let expectedMessage: string

  let messageWithChannelName: {
    id: string
    type: number
    message: string
    createdAt: number
    channelId: string
    userId: string
    media?: FileMetadata
    channelName: string
  }

  beforeAll(async () => {
    store = prepareStore().store

    factory = await getReduxStoreFactory(store)
    const baseTypes = await getBaseTypesFactory()

    community = await factory.create('Community')
    alice = await factory.create('Identity', {
      communityId: community.id,
      userId: 'userIdAlice',
    })
    alicesProfile = await factory.create('UserProfile', {
      userId: alice.userId,
      nickname: 'alice',
    })

    const generalChannelState = publicChannels.selectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    photoChannel = (
      await factory.create('PublicChannel', {
        channel: {
          name: 'photo',
          description: 'Welcome to #photo',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.userId,
          id: generateTestChannelId('photo'),
          public: true,
        },
      })
    ).channel
    const channelMessage: ChannelMessage = await baseTypes.create('ChannelMessage', {
      channelId: photoChannel.id,
      createdAt: 0,
      id: 'id',
      message: 'message',
      userId: alice.userId,
      type: MessageType.Basic,
    })

    payload = {
      channelId: photoChannel.id,
      message: channelMessage,
    }

    messageWithChannelName = { ...channelMessage, channelName: photoChannel.name }
    expectedMessage = JSON.stringify(messageWithChannelName)
  })

  test('show notification for new messages', async () => {
    jest.mock('react-native/Libraries/AppState/AppState', () => ({
      currentState: 'active',
    }))

    Platform.OS = 'android'

    NativeModules.CommunicationModule = {
      handleIncomingEvents: jest.fn(),
    }

    await expectSaga(showNotificationSaga, publicChannels.actions.markUnreadChannel(payload))
      .withReducer(
        combineReducers({
          ...StateManager.reducers,
          [StoreKeys.Init]: initReducer,
          [StoreKeys.Navigation]: navigationReducer,
        }),
        {
          ...store.getState(),
          [StoreKeys.Init]: {
            ...new InitState(),
          },
          [StoreKeys.Navigation]: {
            ...new NavigationState(),
            backStack: [ScreenNames.ChannelScreen],
          },
        }
      )
      .provide([[call.fn(NativeModules.CommunicationModule.handleIncomingEvents), null]])
      .call(JSON.stringify, messageWithChannelName)
      .call(
        NativeModules.CommunicationModule.handleIncomingEvents,
        PUSH_NOTIFICATION_CHANNEL,
        expectedMessage,
        alicesProfile.nickname
      )
      .run()
  })

  test('do not show notifications when the app is in background', async () => {
    jest.mock('react-native/Libraries/AppState/AppState', () => ({
      currentState: 'background',
    }))

    Platform.OS = 'android'

    NativeModules.CommunicationModule = {
      handleIncomingEvents: jest.fn(),
    }

    const username = 'alice'

    await expectSaga(showNotificationSaga, publicChannels.actions.markUnreadChannel(payload))
      .withReducer(
        combineReducers({
          ...StateManager.reducers,
          [StoreKeys.Init]: initReducer,
          [StoreKeys.Navigation]: navigationReducer,
        }),
        {
          ...store.getState(),
          [StoreKeys.Init]: {
            ...new InitState(),
          },
          [StoreKeys.Navigation]: {
            ...new NavigationState(),
            backStack: [ScreenNames.ChannelScreen],
          },
        }
      )
      .provide([
        [call.fn(NativeModules.CommunicationModule.handleIncomingEvents), null],
        [select(users.selectors.allUsers), { userId: { username } }],
      ])
      .not.call(NativeModules.CommunicationModule.handleIncomingEvents)
      .run()
  })

  test('do not show notifications when current screen is a channel list', async () => {
    jest.mock('react-native/Libraries/AppState/AppState', () => ({
      currentState: 'background',
    }))

    Platform.OS = 'android'

    NativeModules.CommunicationModule = {
      handleIncomingEvents: jest.fn(),
    }

    const username = 'alice'

    await expectSaga(showNotificationSaga, publicChannels.actions.markUnreadChannel(payload))
      .withReducer(
        combineReducers({
          ...StateManager.reducers,
          [StoreKeys.Init]: initReducer,
          [StoreKeys.Navigation]: navigationReducer,
        }),
        {
          ...store.getState(),
          [StoreKeys.Init]: {
            ...new InitState(),
          },
          [StoreKeys.Navigation]: {
            ...new NavigationState(),
            backStack: [ScreenNames.ChannelScreen],
          },
        }
      )
      .provide([
        [call.fn(NativeModules.CommunicationModule.handleIncomingEvents), null],
        [select(users.selectors.allUsers), { userId: { username } }],
      ])
      .not.call(NativeModules.CommunicationModule.handleIncomingEvents)
      .run()
  })
})
