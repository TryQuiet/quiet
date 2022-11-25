import {
  CertificateChainValidationEngine,
  CertificateChainValidationEngineVerifyResult,
  CertificateRevocationList
} from 'pkijs'

import { loadCertificate } from './common'

export const verifyUserCert = async (
  rootCACert: string,
  userCert: string
): Promise<CertificateChainValidationEngineVerifyResult> => {
  const trustedCerts = [loadCertificate(rootCACert)]
  const certificates = [loadCertificate(userCert)]
  const crls: CertificateRevocationList[] = []
  const certChainVerificationEngine = new CertificateChainValidationEngine({
    trustedCerts,
    certs: certificates,
    crls
  })
  return await certChainVerificationEngine.verify()
}
