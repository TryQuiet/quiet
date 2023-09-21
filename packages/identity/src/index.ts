import { createRootCA, type RootCA } from './createRootCA'
import {
  extractPubKey,
  parseCertificate,
  parseCertificationRequest,
  keyFromCertificate,
  keyObjectFromString,
  extractPubKeyString,
  pubKeyFromCsr,
  getPubKey,
} from './extractPubKey'
import { verifyUserCert } from './verifyUserCertificate'
import { verifySignature, verifyDataSignature } from './verifySignature'
import { sign, signData } from './sign'
import { createUserCsr, type UserCsr } from './createUserCsr'
import { createUserCert, type UserCert } from './createUserCert'
import {
  loadPrivateKey,
  loadCSR,
  loadCertificate,
  formatPEM,
  generateKeyPair,
  getCertFieldValue,
  CertFieldsTypes,
  hexStringToArrayBuffer,
  arrayBufferToHexString,
  getReqFieldValue,
  certificateByUsername,
  pubKeyMatch,
} from './common'
import configCrypto from './config'
import {
  setupCrypto,
  createTestRootCA,
  createTestUserCert,
  createTestUserCsr,
  userData,
  createRootCertificateTestHelper,
  createUserCertificateTestHelper,
} from './test/helpers'

export { createRootCA }
export type { RootCA }
export {
  extractPubKey,
  parseCertificate,
  keyFromCertificate,
  keyObjectFromString,
  extractPubKeyString,
  pubKeyFromCsr,
  parseCertificationRequest,
  getPubKey,
}
export { verifyUserCert }
export { verifySignature, verifyDataSignature }
export { sign, signData }
export { createUserCsr, type UserCsr }
export { createUserCert, type UserCert }
export {
  loadPrivateKey,
  loadCSR,
  loadCertificate,
  formatPEM,
  generateKeyPair,
  getCertFieldValue,
  CertFieldsTypes,
  hexStringToArrayBuffer,
  arrayBufferToHexString,
  certificateByUsername,
  pubKeyMatch,
}
export { configCrypto }
export { setupCrypto }
export {
  createTestRootCA,
  createTestUserCert,
  createTestUserCsr,
  userData,
  createRootCertificateTestHelper,
  createUserCertificateTestHelper,
}
export { getReqFieldValue }
