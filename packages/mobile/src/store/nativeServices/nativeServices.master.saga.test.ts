import { testSaga } from 'redux-saga-test-plan'
import { communities } from '@quiet/state-manager'
import { nativeServicesCallbacksSaga } from './events/nativeServicesCallbacks'
import { nativeServicesActions } from './nativeServices.slice'
import {
  admissionResetMasterSaga,
  admissionResetWorkerSaga,
  flushPersistorWatcherSaga,
  nativeServicesMasterSaga,
} from './nativeServices.master.saga'

describe('nativeServicesMasterSaga', () => {
  it('installs the flush watcher before subscribing to lifecycle callbacks', () => {
    testSaga(nativeServicesMasterSaga).next().fork(flushPersistorWatcherSaga).next().fork(nativeServicesCallbacksSaga)
  })

  it('coalesces reset completions and retries through one leading worker', () => {
    testSaga(admissionResetMasterSaga)
      .next()
      .takeLeading(
        [
          communities.actions.setAdmissionResetStatus.type,
          nativeServicesActions.retryAdmissionCleanup.type,
          nativeServicesActions.retryAdmissionFinalization.type,
        ],
        admissionResetWorkerSaga
      )
  })
})
