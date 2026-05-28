import { NativeModules, Platform } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'

import { deleteNotificationTokenSaga, hasGrantedNotificationPermissionSaga } from './pushNotifications.master.saga'
import Config from 'react-native-config'

describe('pushNotificationMasterSaga', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    NativeModules.FirebaseMessagingModule.deleteToken.mockReset()
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
