import { NativeModules } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { app } from '@quiet/state-manager'

import { initSelectors } from '../../init/init.selectors'
import { leaveCommunitySaga } from './leaveCommunity.saga'

describe('leaveCommunitySaga', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    NativeModules.FirebaseMessagingModule.deleteToken.mockReset()
    NativeModules.CommunicationModule.clearSensitiveData.mockReset()
  })

  it('closes backend services, deletes Firebase token, and clears native sensitive data', async () => {
    await expectSaga(leaveCommunitySaga)
      .provide([
        [select(initSelectors.isWebsocketConnected), true],
        [call.fn(NativeModules.FirebaseMessagingModule.deleteToken), null],
        [call.fn(NativeModules.CommunicationModule.clearSensitiveData), null],
      ])
      .put.like({
        action: {
          type: app.actions.closeServices.type,
        },
      })
      .call.fn(NativeModules.FirebaseMessagingModule.deleteToken)
      .call.fn(NativeModules.CommunicationModule.clearSensitiveData)
      .run()
  })

  it('still leaves the community when Firebase token deletion throws', async () => {
    jest.spyOn(NativeModules.FirebaseMessagingModule, 'deleteToken').mockImplementation(() => {
      throw new Error('delete failed')
    })

    await expectSaga(leaveCommunitySaga)
      .provide([[select(initSelectors.isWebsocketConnected), true]])
      .put.like({
        action: {
          type: app.actions.closeServices.type,
        },
      })
      .run()
  })

  it('still leaves the community when native cleanup throws', async () => {
    jest.spyOn(NativeModules.CommunicationModule, 'clearSensitiveData').mockImplementation(() => {
      throw new Error('cleanup failed')
    })

    await expectSaga(leaveCommunitySaga)
      .provide([[select(initSelectors.isWebsocketConnected), true]])
      .put.like({
        action: {
          type: app.actions.closeServices.type,
        },
      })
      .run()
  })
})
