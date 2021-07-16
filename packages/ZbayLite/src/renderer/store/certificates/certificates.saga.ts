import { call, apply, all, takeEvery, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'

import { certificatesActions } from './certificates.reducer'
import { createUserCsr } from '@zbayapp/identity'
import electronStore from '../../../shared/electronStore'
import { actions as identityActions } from '../handlers/identity'
import { registrationServiceAddress } from '../../../shared/static'
import notificationsHandlers from '../../store/handlers/notifications'
import { successNotification } from '../handlers/utils'

export function* responseGetCertificates(
  action: PayloadAction<ReturnType<typeof certificatesActions.responseGetCertificates>['payload']>
): Generator {
  const certificates = action.payload
  yield* put(certificatesActions.setUsersCertificates(certificates.certificates))
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
