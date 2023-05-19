import { NativeModules, Platform } from 'react-native'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { showNotificationSaga } from './showNotification.saga'
import {
  publicChannels,
  users,
  MarkUnreadChannelPayload,
  PUSH_NOTIFICATION_CHANNEL
} from '@quiet/state-manager'
import { StoreKeys } from '../../store.keys'
import { initReducer, InitState } from '../../init/init.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationReducer, NavigationState } from '../../navigation/navigation.slice'

describe('showNotificationSaga', () => {
  let payload: MarkUnreadChannelPayload

  beforeAll(async () => {
    payload = {
      channelId: 'channelId',
      message: {
        channelId: 'address',
        createdAt: 0,
        id: 'id',
        message: 'message',
        pubKey: 'pubKey',
        signature: 'signature',
        type: 1
      }
    }
  })

  test('show notification for new messages', async () => {
    jest.mock('react-native/Libraries/AppState/AppState', () => ({
      currentState: 'active'
    }))

    Platform.OS = 'android'

    NativeModules.CommunicationModule = {
      handleIncomingEvents: jest.fn()
    }

    const username = 'alice'
    const message = JSON.stringify(payload.message)

    await expectSaga(showNotificationSaga, publicChannels.actions.markUnreadChannel(payload))
      .withReducer(combineReducers({ [StoreKeys.Init]: initReducer, [StoreKeys.Navigation]: navigationReducer }), {
        [StoreKeys.Init]: {
          ...new InitState(),
        },
        [StoreKeys.Navigation]: {
          ...new NavigationState(),
          currentScreen: ScreenNames.ChannelScreen
        }
      })
      .provide([
        [call.fn(JSON.stringify), message],
        [call.fn(NativeModules.CommunicationModule.handleIncomingEvents), null],
        [select(users.selectors.certificatesMapping), { pubKey: { username: username } }]
      ])
      .call(NativeModules.CommunicationModule.handleIncomingEvents, PUSH_NOTIFICATION_CHANNEL, message, username)
      .run()
  })

  test('do not show notifications when the app is in background', async () => {
    jest.mock('react-native/Libraries/AppState/AppState', () => ({
      currentState: 'background'
    }))

    Platform.OS = 'android'

    NativeModules.CommunicationModule = {
      handleIncomingEvents: jest.fn()
    }

    const username = 'alice'
    const message = JSON.stringify(payload.message)

    await expectSaga(showNotificationSaga, publicChannels.actions.markUnreadChannel(payload))
    .withReducer(combineReducers({ [StoreKeys.Init]: initReducer, [StoreKeys.Navigation]: navigationReducer }), {
      [StoreKeys.Init]: {
        ...new InitState(),
      },
      [StoreKeys.Navigation]: {
        ...new NavigationState(),
        currentScreen: ScreenNames.ChannelScreen
      }
    })
      .provide([
        [call.fn(JSON.stringify), message],
        [call.fn(NativeModules.CommunicationModule.handleIncomingEvents), null],
        [select(users.selectors.certificatesMapping), { pubKey: { username: username } }]
      ])
      .not.call(NativeModules.CommunicationModule.handleIncomingEvents)
      .run()
  })

  test('do not show notifications when current screen is a channel list', async () => {
    jest.mock('react-native/Libraries/AppState/AppState', () => ({
      currentState: 'background'
    }))

    Platform.OS = 'android'

    NativeModules.CommunicationModule = {
      handleIncomingEvents: jest.fn()
    }

    const username = 'alice'
    const message = JSON.stringify(payload.message)

    await expectSaga(showNotificationSaga, publicChannels.actions.markUnreadChannel(payload))
    .withReducer(combineReducers({ [StoreKeys.Init]: initReducer, [StoreKeys.Navigation]: navigationReducer }), {
      [StoreKeys.Init]: {
        ...new InitState(),
      },
      [StoreKeys.Navigation]: {
        ...new NavigationState(),
        currentScreen: ScreenNames.ChannelListScreen
      }
    })
      .provide([
        [call.fn(JSON.stringify), message],
        [call.fn(NativeModules.CommunicationModule.handleIncomingEvents), null],
        [select(users.selectors.certificatesMapping), { pubKey: { username: username } }]
      ])
      .not.call(NativeModules.CommunicationModule.handleIncomingEvents)
      .run()
  })
})
