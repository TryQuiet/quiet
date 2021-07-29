import { createRootCA, RootCA } from "../generateRootCA"
import { createUserCert } from "../generateUserCertificate"
import { createUserCsr, UserCsr } from "../requestCertificate"
import config from '../config'
import { Time } from 'pkijs'

export const userData = {
  zbayNickname: 'userName',
  commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
  peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
  dmPublicKey: '0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9',
  signAlg: config.signAlg,
  hashAlg: config.hashAlg
}

const notBeforeDate = new Date()
const notAfterDate = new Date(2030, 1, 1)

export async function createTestRootCA(commonName?: string): Promise<RootCA> {
  return await createRootCA(new Time({ type: 1, value: notBeforeDate }), new Time({ type: 1, value: notAfterDate }), commonName)
}

export async function createTestUserCsr(): Promise<UserCsr> {
  return await createUserCsr(userData)
}

export async function createTestUserCert(rootCert?: RootCA, userCsr?: UserCsr) {
  const rootC = rootCert || await createTestRootCA()
  const user = userCsr || await createTestUserCsr()
  return await createUserCert(rootC.rootCertString, rootC.rootKeyString, user.userCsr, notBeforeDate, notAfterDate)
}
