import { call, apply, all, takeEvery, put, select } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'

import { certificatesActions } from './certificates.reducer'
import { createUserCsr, configCrypto, CertFieldsTypes, parseCertificate, getCertFieldValue } from '@zbayapp/identity'
import electronStore from '../../../shared/electronStore'
import { actions as identityActions } from '../handlers/identity'
import { registrationServiceAddress } from '../../../shared/static'
import notificationsHandlers from '../../store/handlers/notifications'
import { successNotification } from '../handlers/utils'
import directMessagesSelectors from '../selectors/directMessages'

const filterCertificates = (certificates: string[]): string[] => {
  return certificates.filter((cert) => {
    const parsedCert = parseCertificate(cert)

    let isValid = true

    for (const field of Object.keys(CertFieldsTypes)) {
      if (cert && !getCertFieldValue(parsedCert, CertFieldsTypes[field])) {
        isValid = false
      }
    }
    return isValid
  })
}

export function* responseGetCertificates(
  action: PayloadAction<ReturnType<typeof certificatesActions.responseGetCertificates>['payload']>
): Generator {
  const certificates = action.payload

  const filteredCertificates = filterCertificates(certificates.certificates)
  yield* put(certificatesActions.setUsersCertificates(filteredCertificates))
}

export function* responseGetCertificate(): Generator {
  console.log('Response get cert saga, setting registration status')
  electronStore.set('isNewUser', false)
  yield* put(
    identityActions.setRegistraionStatus({
      nickname: '',
      status: 'SUCCESS'
    })
  )
  yield* put(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({
        message: 'Username registered.'
      })
    )
  )
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function* createOwnCertificate(
  action: PayloadAction<ReturnType<typeof certificatesActions.createOwnCertificate>['payload']>
): Generator {
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

  const peerIdAddress = yield* apply(electronStore, electronStore.get, ['peerId'])

  if (!isString(peerIdAddress)) {
    console.log('invalid peer id address or not exist')
    return
  }

  const dmPublicKey = yield* select(directMessagesSelectors.publicKey)

  const userData = {
    zbayNickname: action.payload,
    commonName: hiddenServices.libp2pHiddenService.onionAddress,
    peerId: peerIdAddress,
    dmPublicKey: dmPublicKey,
    signAlg: configCrypto.signAlg,
    hashAlg: configCrypto.hashAlg
  }

  console.log('userData', userData)

  const user = yield* call(createUserCsr, userData)

  yield put(
    certificatesActions.registerUserCertificate({
      serviceAddress: registrationServiceAddress,
      userCsr: user.userCsr
    })
  )

  yield* put(certificatesActions.setOwnCertKey(user.userKey))
  console.log('After registering csr')
}

export function* certificatesSaga(): Generator {
  yield* all([
    takeEvery(certificatesActions.responseGetCertificates.type, responseGetCertificates),
    takeEvery(certificatesActions.createOwnCertificate.type, createOwnCertificate),
    takeEvery(certificatesActions.setOwnCertificate.type, responseGetCertificate)
  ])
}
