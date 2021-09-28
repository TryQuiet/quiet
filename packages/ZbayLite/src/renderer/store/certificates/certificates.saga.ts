// import { call, apply, all, takeEvery, put, select } from 'typed-redux-saga'
// import { PayloadAction } from '@reduxjs/toolkit'
// import { certificatesActions } from './certificates.reducer'
// import { createUserCsr, configCrypto, CertFieldsTypes, parseCertificate, getCertFieldValue } from '@zbayapp/identity'
// import electronStore from '../../../shared/electronStore'
// import { actions } from '../handlers/directMessages'
// import { actions as identityActions } from '../handlers/identity'
// import { registrationServiceAddress } from '../../../shared/static'
// import notificationsHandlers from '../handlers/notifications'
// import { successNotification } from '../handlers/utils'
// import directMessagesSelectors from '../selectors/directMessages'
// import contactsSelectors from '../selectors/contacts'

// const filterCertificates = (certificates: string[]): string[] => {
//   return certificates.filter((cert) => {
//     const parsedCert = parseCertificate(cert)

//     let isValid = true

//     for (const field of Object.keys(CertFieldsTypes)) {
//       if (cert && !getCertFieldValue(parsedCert, CertFieldsTypes[field])) {
//         isValid = false
//       }
//     }
//     return isValid
//   })
// }

// export function* responseGetCertificates(
//   action: PayloadAction<ReturnType<typeof certificatesActions.responseGetCertificates>['payload']>
// ): Generator {
//   const certificates = action.payload
//   const filteredCertificates = filterCertificates(certificates.certificates)
//   yield* put(certificatesActions.setUsersCertificates(filteredCertificates))
//   const users = yield* select(contactsSelectors.usersCertificateMapping)
//   for (const [key, value] of Object.entries(users)) {
//     if (value.dmPublicKey && value.username) {
//       yield put(
//         actions.fetchUsers({
//           usersList: {
//             [value.username]: {
//               publicKey: key,
//               halfKey: value.dmPublicKey,
//               nickname: value.username
//             }
//           }
//         })
//       )
//     }
//   }
// }

// export function* responseGetCertificate(): Generator {
//   electronStore.set('isNewUser', false)
//   yield* put(
//     identityActions.setRegistraionStatus({
//       nickname: '',
//       status: 'SUCCESS'
//     })
//   )
//   yield* put(
//     notificationsHandlers.actions.enqueueSnackbar(
//       successNotification({
//         message: 'Username registered.'
//       })
//     )
//   )
// }

// function isString(value: unknown): value is string {
//   return typeof value === 'string'
// }

// export function* createOwnCertificate(
//   action: PayloadAction<ReturnType<typeof certificatesActions.createOwnCertificate>['payload']>
// ): Generator {
//   interface HiddenServicesType {
//     libp2pHiddenService?: {
//       onionAddress: string
//       privateKey: string
//     }
//   }

//   const hiddenServices: HiddenServicesType = yield* apply(electronStore, electronStore.get, [
//     'hiddenServices'
//   ])

//   const peerIdAddress = yield* apply(electronStore, electronStore.get, ['peerId'])

//   if (!isString(peerIdAddress)) {
//     console.log('invalid peer id address or not exist')
//     return
//   }
//   const dmPublicKey = yield* select(directMessagesSelectors.publicKey)

//   const userData = {
//     zbayNickname: action.payload,
//     commonName: hiddenServices.libp2pHiddenService.onionAddress,
//     peerId: peerIdAddress,
//     dmPublicKey: dmPublicKey,
//     signAlg: configCrypto.signAlg,
//     hashAlg: configCrypto.hashAlg
//   }

//   const user = yield* call(createUserCsr, userData)

//   yield put(
//     certificatesActions.registerUserCertificate({
//       serviceAddress: registrationServiceAddress,
//       userCsr: user.userCsr
//     })
//   )

//   yield* put(certificatesActions.setOwnCertKey(user.userKey))
// }

// export function* certificatesSaga(): Generator {
//   yield* all([
//     takeEvery(certificatesActions.responseGetCertificates.type, responseGetCertificates),
//     takeEvery(certificatesActions.createOwnCertificate.type, createOwnCertificate),
//     takeEvery(certificatesActions.setOwnCertificate.type, responseGetCertificate)
//   ])
// }
