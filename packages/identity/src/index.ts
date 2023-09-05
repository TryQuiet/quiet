import { createRootCA, type RootCA } from './generateRootCA'
import {
  extractPubKey,
  parseCertificate,
  keyFromCertificate,
  keyObjectFromString,
  extractPubKeyString,
  pubKeyFromCsr,
} from './extractPubKey'
import { verifyUserCert } from './verifyUserCertificate'
import { verifySignature } from './verification'
import { sign } from './sign'
import { createUserCsr, type UserCsr } from './requestCertificate'
import { createUserCert, type UserCert } from './generateUserCertificate'
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
export { extractPubKey, parseCertificate, keyFromCertificate, keyObjectFromString, extractPubKeyString, pubKeyFromCsr }
export { verifyUserCert }
export { verifySignature }
export { sign }
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
