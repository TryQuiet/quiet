import { SendCertificatesResponse } from '@quiet/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { select, call, put } from 'typed-redux-saga'
import { identitySelectors } from '../identity.selectors'
import { CertFieldsTypes, getCertFieldValue, getReqFieldValue, loadCSR, parseCertificate } from '@quiet/identity'
import { identityActions } from '../identity.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'

export function* updateCertificateSaga(action: PayloadAction<SendCertificatesResponse>): Generator {
  const certificate = yield* select(identitySelectors.communityMembership)
  const communityId = yield* select(communitiesSelectors.currentCommunityId)

  if (certificate) return

  const csr = yield* select(identitySelectors.csr)

  if (!csr?.userCsr) return

  const parsedCsr = yield* call(loadCSR, csr?.userCsr)
  const pubKey = getReqFieldValue(parsedCsr, CertFieldsTypes.dmPublicKey)

  const cert = action.payload.certificates.find(cert => {
    const parsedCert = parseCertificate(cert)
    const certPubKey = getCertFieldValue(parsedCert, CertFieldsTypes.dmPublicKey)
    if (certPubKey === pubKey) return cert
  })

  if (cert) {
    yield* put(
      identityActions.storeUserCertificate({
        userCertificate: cert,
        communityId,
      })
    )
  }
}
