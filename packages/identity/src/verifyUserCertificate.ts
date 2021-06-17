import { CertificateChainValidationEngine } from 'pkijs'

import { loadCertificate } from './common'

interface CertVerification {
  result: string,
  resultCode: number,
  resultMessage: string
}

export const verifyUserCert = async (rootCACert: string, userCert: string): Promise<CertVerification> => {
  const trustedCerts = [await loadCertificate(rootCACert)]
  const certificates = [await loadCertificate(userCert)]
  const crls = []
  const certChainVerificationEngine = new CertificateChainValidationEngine({
    trustedCerts,
    certs: certificates,
    crls
  })
  return await certChainVerificationEngine.verify()
}
