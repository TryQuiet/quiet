import { all, takeEvery } from 'redux-saga/effects'
import { CertificatesActions, certificatesActions } from './certificates.reducer'

export function* responseGetCertificates(
  action: CertificatesActions['responseGetCertificates']
): Generator {
  console.log(`payload is ${action.payload.certificates}`)
}

export function* certificatesSaga(): Generator {
  yield all([
    takeEvery(certificatesActions.responseGetCertificates.type, responseGetCertificates)
  ])
}
