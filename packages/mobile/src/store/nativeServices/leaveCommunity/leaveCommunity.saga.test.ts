import { NativeModules } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { app } from '@quiet/state-manager'

import { leaveCommunitySaga } from './leaveCommunity.saga'

describe('leaveCommunitySaga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('closes backend services and clears native sensitive data', async () => {
    await expectSaga(leaveCommunitySaga)
      .provide([[call.fn(NativeModules.CommunicationModule.clearSensitiveData), null]])
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
      .put.like({
        action: {
          type: app.actions.closeServices.type,
        },
      })
      .run()
  })
})
