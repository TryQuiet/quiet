import { createSelector } from 'reselect'

import { Store } from '../reducers'
import { StoreKeys } from '../store.keys'

const certificates = (s: Store) => s[StoreKeys.Certificates]

const usersCertificates = createSelector(certificates, (c) => c.usersCertificates)
const ownCertificate = createSelector(certificates, (c) => c.ownCertificate.certificate)
const ownPrivKey = createSelector(certificates, (c) => c.ownCertificate.privateKey)
const certificateRegistrationError = createSelector(certificates, (c) => c.registrationError)

export default {
  usersCertificates,
  ownCertificate,
  ownPrivKey,
  certificateRegistrationError
}
