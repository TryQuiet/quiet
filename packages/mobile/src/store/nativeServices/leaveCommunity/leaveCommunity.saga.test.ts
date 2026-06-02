import { NativeModules, Platform } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { app } from '@quiet/state-manager'

import { initSelectors } from '../../init/init.selectors'
import { leaveCommunitySaga } from './leaveCommunity.saga'
import { deleteNotificationTokenSaga } from '../../pushNotifications'
import Config from 'react-native-config'

describe('leaveCommunitySaga', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    NativeModules.FirebaseMessagingModule.deleteToken.mockReset()
    NativeModules.CommunicationModule.clearSensitiveData.mockReset()
  })

  it('closes backend services, deletes Firebase token, and clears native sensitive data', async () => {
    Platform.OS = 'android'
    Config.QPS_ALLOWED = 'true'

    await expectSaga(leaveCommunitySaga)
      .provide([
        [select(initSelectors.isWebsocketConnected), true],
        [call.fn(deleteNotificationTokenSaga), null],
        [call.fn(NativeModules.CommunicationModule.clearSensitiveData), null],
      ])
      .put.like({
        action: {
          type: app.actions.closeServices.type,
        },
      })
      .call.fn(deleteNotificationTokenSaga)
      .call.fn(NativeModules.CommunicationModule.clearSensitiveData)
      .run()
  })

  it('still leaves the community when Firebase token deletion saga throws', async () => {
    jest.mock('../../pushNotifications', () => ({
      ...jest.requireActual('../../pushNotifications'),
      deleteNotificationTokenSaga: jest.fn(() => {
        throw new Error('delete failed')
      }),
    }))
    await expectSaga(leaveCommunitySaga)
      .provide([
        [select(initSelectors.isWebsocketConnected), true],
        [call.fn(NativeModules.CommunicationModule.clearSensitiveData), null],
      ])
      .put.like({
        action: {
          type: app.actions.closeServices.type,
        },
      })
      .call.fn(NativeModules.CommunicationModule.clearSensitiveData)
      .run()
  })

  it('still leaves the community when native cleanup throws', async () => {
    jest.spyOn(NativeModules.CommunicationModule, 'clearSensitiveData').mockImplementation(() => {
      throw new Error('cleanup failed')
    })

    await expectSaga(leaveCommunitySaga)
      .provide([
        [select(initSelectors.isWebsocketConnected), true],
        [call.fn(deleteNotificationTokenSaga), null],
      ])
      .put.like({
        action: {
          type: app.actions.closeServices.type,
        },
      })
      .call.fn(deleteNotificationTokenSaga)
      .run()
  })
})
