import { type Socket } from '../../types'
import { all, takeEvery } from 'typed-redux-saga'
import { identityActions } from './identity.slice'
import { registerCertificateSaga } from './registerCertificate/registerCertificate.saga'
import { registerUsernameSaga } from './registerUsername/registerUsername.saga'
import { verifyJoinTimestampSaga } from './verifyJoinTimestamp/verifyJoinTimestamp.saga'
import { saveUserCsrSaga } from './saveUserCsr/saveUserCsr.saga'
import { usersActions } from '../users/users.slice'
import { updateCertificateSaga } from './updateCertificate/updateCertificate.saga'
import { checkLocalCsrSaga } from './checkLocalCsr/checkLocalCsr.saga'

export function* identityMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(identityActions.registerUsername.type, registerUsernameSaga, socket),
    takeEvery(identityActions.registerCertificate.type, registerCertificateSaga, socket),
    takeEvery(identityActions.verifyJoinTimestamp.type, verifyJoinTimestampSaga),
    takeEvery(identityActions.checkLocalCsr.type, checkLocalCsrSaga),
    takeEvery(identityActions.saveUserCsr.type, saveUserCsrSaga, socket),
    takeEvery(usersActions.responseSendCertificates.type, updateCertificateSaga),
  ])
}
