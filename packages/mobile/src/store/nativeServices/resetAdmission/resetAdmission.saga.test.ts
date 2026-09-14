import { NativeModules } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { communities } from '@quiet/state-manager'
import { persistor } from '../../store'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { finishAdmissionResetSaga } from './resetAdmission.saga'

describe('finishAdmissionResetSaga', () => {
  it('clears native state, persists the reset, and returns to Join Community', async () => {
    await expectSaga(finishAdmissionResetSaga, communities.actions.setAdmissionResetStatus('complete'))
      .provide([
        [call.fn(NativeModules.CommunicationModule.clearSensitiveData), undefined],
        [call.fn(persistor.flush), undefined],
      ])
      .call.fn(NativeModules.CommunicationModule.clearSensitiveData)
      .call.fn(persistor.flush)
      .put(navigationActions.resetToScreen({ screen: ScreenNames.JoinCommunityScreen }))
      .put(communities.actions.setAdmissionResetStatus('idle'))
      .run()
  })

  it('does nothing for non-complete transitions', async () => {
    await expectSaga(finishAdmissionResetSaga, communities.actions.setAdmissionResetStatus('pending'))
      .not.call.fn(NativeModules.CommunicationModule.clearSensitiveData)
      .not.call.fn(persistor.flush)
      .run()
  })
})
