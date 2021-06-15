import { CertificateChainValidationEngine } from 'pkijs'

import { loadCertificate } from './common'

export const verifyUserCert = async (rootCACert, userCert) => {
  const trustedCerts = [await loadCertificate(rootCACert)]
  const certificates = [await loadCertificate(userCert)]
  const crls = []
  const certChainVerificationEngine = new CertificateChainValidationEngine({
    trustedCerts,
    certs: certificates,
    crls
  })
  return certChainVerificationEngine.verify()
}
