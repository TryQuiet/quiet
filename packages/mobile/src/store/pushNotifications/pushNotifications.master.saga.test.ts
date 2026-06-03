jest.mock('../nativeServices/events/nativeEventEmitter', () => ({
  __esModule: true,
  default: {
    addListener: jest.fn(),
  },
}))

import { AppState, NativeModules, Platform } from 'react-native'
import { runSaga, stdChannel } from 'redux-saga'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import waitForExpect from 'wait-for-expect'
import { communities, pushNotifications as stateManagerPushNotifications } from '@quiet/state-manager'

import {
  deleteNotificationTokenSaga,
  hasGrantedNotificationPermissionSaga,
  pushNotificationsMasterSaga,
} from './pushNotifications.master.saga'
import Config from 'react-native-config'
import nativeEventEmitter from '../nativeServices/events/nativeEventEmitter'
import { InitState } from '../init/init.slice'
import { StoreKeys } from '../store.keys'
import { NotificationPermissionStatus } from './pushNotifications.types'
import { PushNotificationsState, pushNotificationsActions } from './pushNotifications.slice'

const NOTIFICATION_PERMISSION_RESULT = 'notificationPermissionResult'
const DEVICE_TOKEN_RECEIVED = 'deviceTokenReceived'
const nativeEventHandlers = new Map<string, (payload: unknown) => void>()
type DispatchedAction = { type: string; payload?: unknown }

describe('pushNotificationMasterSaga', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    NativeModules.FirebaseMessagingModule.deleteToken.mockReset()
    NativeModules.FirebaseMessagingModule.getToken.mockReset()
    NativeModules.CommunicationModule.requestNotificationPermission.mockReset()
    NativeModules.CommunicationModule.checkNotificationPermission.mockReset()
    nativeEventHandlers.clear()
    ;(nativeEventEmitter.addListener as jest.Mock).mockReset()
    ;(nativeEventEmitter.addListener as jest.Mock).mockImplementation(
      (eventName: string, handler: (payload: unknown) => void) => {
        nativeEventHandlers.set(eventName, handler)
        return { remove: jest.fn() }
      }
    )
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any)
  })

  it('requests Android notification permission when qps is disabled but blocks Firebase token flows', async () => {
    Platform.OS = 'android'
    Config.QPS_ALLOWED = 'false'
    NativeModules.FirebaseMessagingModule.getToken.mockResolvedValue('current-token')

    const channel = stdChannel()
    const dispatched: DispatchedAction[] = []
    const state = {
      [StoreKeys.Init]: {
        ...new InitState(),
        isWebsocketConnected: true,
      },
      [StoreKeys.PushNotifications]: {
        ...new PushNotificationsState(),
        permissionRequested: false,
        permissionStatus: NotificationPermissionStatus.Granted,
      },
    }
    const task = runSaga(
      {
        channel,
        dispatch: action => {
          if (action && typeof action === 'object' && 'type' in action) {
            const dispatchedAction = action as DispatchedAction
            dispatched.push(dispatchedAction)
            channel.put(dispatchedAction)
          }
        },
        getState: () => state,
      },
      pushNotificationsMasterSaga
    )

    try {
      await waitForExpect(() => {
        expect(NativeModules.CommunicationModule.requestNotificationPermission).toHaveBeenCalledTimes(1)
        expect(nativeEventHandlers.get(NOTIFICATION_PERMISSION_RESULT)).toBeDefined()
        expect(nativeEventHandlers.get(DEVICE_TOKEN_RECEIVED)).toBeDefined()
      })

      channel.put(communities.actions.setCurrentCommunity('community-id'))
      nativeEventHandlers.get(NOTIFICATION_PERMISSION_RESULT)?.({ status: NotificationPermissionStatus.Granted })
      nativeEventHandlers.get(DEVICE_TOKEN_RECEIVED)?.({ token: 'live-token' })

      await waitForExpect(() => {
        expect(dispatched).toEqual(
          expect.arrayContaining([pushNotificationsActions.setPermissionStatus(NotificationPermissionStatus.Granted)])
        )
      })

      expect(NativeModules.FirebaseMessagingModule.getToken).not.toHaveBeenCalled()
      expect(NativeModules.FirebaseMessagingModule.deleteToken).not.toHaveBeenCalled()
      expect(dispatched).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: stateManagerPushNotifications.actions.sendDeviceTokenToBackend.type,
          }),
        ])
      )
    } finally {
      task.cancel()
      await task.toPromise()
    }
  })

  describe('deleteNotificationTokenSaga', () => {
    it('deletes token when qps enabled and permission was granted', async () => {
      Platform.OS = 'android'
      Config.QPS_ALLOWED = 'true'

      await expectSaga(deleteNotificationTokenSaga)
        .provide([[call.fn(NativeModules.FirebaseMessagingModule.deleteToken), null]])
        .call.fn(NativeModules.FirebaseMessagingModule.deleteToken)
        .run()
    })

    it('skips deleting token when qps disabled', async () => {
      Platform.OS = 'android'
      Config.QPS_ALLOWED = 'false'

      await expectSaga(deleteNotificationTokenSaga)
        .provide([[call.fn(NativeModules.FirebaseMessagingModule.deleteToken), null]])
        .not.call.fn(hasGrantedNotificationPermissionSaga)
        .not.call.fn(NativeModules.FirebaseMessagingModule.deleteToken)
        .run()
    })

    it('still deletes token when permission not granted', async () => {
      Platform.OS = 'android'
      Config.QPS_ALLOWED = 'true'

      await expectSaga(deleteNotificationTokenSaga)
        .provide([
          [call.fn(hasGrantedNotificationPermissionSaga), false],
          [call.fn(NativeModules.FirebaseMessagingModule.deleteToken), null],
        ])
        .call.fn(NativeModules.FirebaseMessagingModule.deleteToken)
        .run()
    })

    it('handles error when delete token fails', async () => {
      Platform.OS = 'android'
      Config.QPS_ALLOWED = 'true'

      jest.spyOn(NativeModules.FirebaseMessagingModule, 'deleteToken').mockImplementationOnce(() => {
        throw new Error('delete failed')
      })

      await expectSaga(deleteNotificationTokenSaga)
        .call.fn(NativeModules.FirebaseMessagingModule.deleteToken)
        .not.throws(Error)
        .run()
    })
  })
})
