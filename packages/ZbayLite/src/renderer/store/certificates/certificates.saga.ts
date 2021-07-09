import { call, apply, all, takeEvery, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'

import { certificatesActions } from './certificates.reducer'
import { createUserCsr } from '../../pkijs/generatePems/requestCertificate'
import { createUserCert } from '../../pkijs/generatePems/generateUserCertificate'
import { dataFromRootPems } from '../../../shared/static'
import electronStore from '../../../shared/electronStore'

export function* responseGetCertificates(
  action: PayloadAction<ReturnType<typeof certificatesActions.responseGetCertificates>['payload']>
): Generator {
  const certificates = action.payload
  yield* put(certificatesActions.setUsersCertificates(certificates.certificates))
}

export const getDate = (date?: string) => date ? new Date(date) : new Date()

export function* creactOwnCertificate(
  action: PayloadAction<ReturnType<typeof certificatesActions.creactOwnCertificate>['payload']>
): Generator {
  const certString = dataFromRootPems.certificate
  const keyString = dataFromRootPems.privKey
  const notBeforeDate = yield* call(getDate)
  const notAfterDate = yield* call(getDate, '1/1/2031')

  interface HiddenServicesType {
    libp2pHiddenService?: {
      onionAddress: string
      privateKey: string
    }
  }

  const hiddenServices: HiddenServicesType = yield* apply(
    electronStore,
    electronStore.get,
    ['hiddenServices']
  )

  let peerIdAddress = yield* apply(electronStore, electronStore.get, ['peerId'])
  if (!peerIdAddress) {
    peerIdAddress = 'unknown'
  }

  const userData = {
    zbayNickname: action.payload,
    commonName: hiddenServices.libp2pHiddenService.onionAddress,
    peerId: peerIdAddress
  }

  console.log('userData', userData)

  const user = yield* call(createUserCsr, userData)

  const userCertData = yield* call(createUserCert, certString, keyString, user.userCsr, notBeforeDate, notAfterDate)

  yield* put(certificatesActions.setOwnCertificate(userCertData.userCertString))
  yield* put(certificatesActions.setOwnCertKey(user.userKey))
  yield* put(certificatesActions.saveCertificate(userCertData.userCertString))
}

export function* certificatesSaga(): Generator {
  yield* all([
    takeEvery(certificatesActions.responseGetCertificates.type, responseGetCertificates),
    takeEvery(certificatesActions.creactOwnCertificate.type, creactOwnCertificate)
  ])
}
