import { CertificateChainValidationEngine } from 'pkijs'

import { loadCertificate } from './common'

export interface CertVerification {
  result: string
  resultCode: number
  resultMessage: string
}

export const verifyUserCert = async (
  rootCACert: string,
  userCert: string
): Promise<CertVerification> => {
  const trustedCerts = [loadCertificate(rootCACert)]
  const certificates = [loadCertificate(userCert)]
  const crls: string[] = []
  const certChainVerificationEngine = new CertificateChainValidationEngine({
    trustedCerts,
    certs: certificates,
    crls
  })
  return await certChainVerificationEngine.verify()
}
