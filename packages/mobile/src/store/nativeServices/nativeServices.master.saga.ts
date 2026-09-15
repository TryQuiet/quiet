import { fork, takeEvery, takeLeading, cancelled } from 'typed-redux-saga'
import { nativeServicesCallbacksSaga } from './events/nativeServicesCallbacks'
import { leaveCommunitySaga } from './leaveCommunity/leaveCommunity.saga'
import { flushPersistorSaga } from './flushPersistor/flushPersistor.saga'
import { nativeServicesActions } from './nativeServices.slice'
import { createLogger } from '../../utils/logger'
import { communities } from '@quiet/state-manager'
import {
  finishAdmissionResetSaga,
  retryAdmissionCleanupSaga,
  retryAdmissionFinalizationSaga,
} from './resetAdmission/resetAdmission.saga'

const logger = createLogger('nativeServicesMaster')

type AdmissionResetAction =
  | ReturnType<typeof communities.actions.setAdmissionResetStatus>
  | ReturnType<typeof nativeServicesActions.retryAdmissionCleanup>
  | ReturnType<typeof nativeServicesActions.retryAdmissionFinalization>

export function* flushPersistorWatcherSaga(): Generator {
  yield* takeEvery(nativeServicesActions.flushPersistor.type, flushPersistorSaga)
}

export function* admissionResetWorkerSaga(action: AdmissionResetAction): Generator {
  if (communities.actions.setAdmissionResetStatus.match(action)) {
    yield* finishAdmissionResetSaga(action)
  } else if (nativeServicesActions.retryAdmissionCleanup.match(action)) {
    yield* retryAdmissionCleanupSaga()
  } else {
    yield* retryAdmissionFinalizationSaga()
  }
}

export function* admissionResetMasterSaga(): Generator {
  // A single leading watcher prevents a normal acknowledgement, replay, or retry from running
  // native cleanup/finalization concurrently. Once the active attempt fails, a later retry is accepted.
  yield* takeLeading(
    [
      communities.actions.setAdmissionResetStatus.type,
      nativeServicesActions.retryAdmissionCleanup.type,
      nativeServicesActions.retryAdmissionFinalization.type,
    ],
    admissionResetWorkerSaga
  )
}

export function* nativeServicesMasterSaga(): Generator {
  logger.info('nativeServicesMasterSaga starting')
  try {
    yield* fork(flushPersistorWatcherSaga)
    yield* fork(nativeServicesCallbacksSaga)
    yield* takeEvery(nativeServicesActions.leaveCommunity.type, leaveCommunitySaga)
  } finally {
    logger.info('nativeServicesMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('nativeServicesMasterSaga cancelled')
    }
  }
}
