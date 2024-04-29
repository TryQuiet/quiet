import { Time, setEngine, CryptoEngine } from 'pkijs'
import { Crypto } from '@peculiar/webcrypto'
import { createRootCA, type RootCA } from '../createRootCA'
import { createUserCert, type UserCert } from '../createUserCert'
import { createUserCsr, type UserCsr } from '../createUserCsr'
import config from '../config'

export const userData = {
  nickname: 'userName',
  commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
  peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
  dmPublicKey: '0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9',
  signAlg: config.signAlg,
  hashAlg: config.hashAlg,
}

const notBeforeDate = new Date()
const notAfterDate = new Date(2030, 1, 1)

export async function createTestRootCA(commonName?: string): Promise<RootCA> {
  return await createRootCA(
    new Time({ type: 1, value: notBeforeDate }),
    new Time({ type: 1, value: notAfterDate }),
    commonName
  )
}

export async function createTestUserCsr(): Promise<UserCsr> {
  return await createUserCsr(userData)
}

export async function createTestUserCert(rootCert?: RootCA, userCsr?: UserCsr): Promise<UserCert> {
  const rootC = rootCert || (await createTestRootCA())
  const user = userCsr || (await createTestUserCsr())
  return await createUserCert(rootC.rootCertString, rootC.rootKeyString, user.userCsr, notBeforeDate, notAfterDate)
}

export function setupCrypto() {
  const webcrypto = new Crypto()
  setEngine(
    'newEngine',
    webcrypto,
    new CryptoEngine({
      name: '',
      crypto: webcrypto,
      subtle: webcrypto.subtle,
    })
  )
  global.crypto = webcrypto
}

export const createRootCertificateTestHelper = async (commonName: string): Promise<RootCA> => {
  return await createRootCA(
    new Time({ type: 0, value: notBeforeDate }),
    new Time({ type: 0, value: notAfterDate }),
    commonName
  )
}

export const createUserCertificateTestHelper = async (
  user: {
    nickname: string
    commonName: string
    peerId: string
    dmPublicKey: string
  },
  rootCA?: Pick<RootCA, 'rootCertString' | 'rootKeyString'> | null
): Promise<{
  userCsr: UserCsr
  userCert?: UserCert
}> => {
  const userCsr = await createUserCsr({
    nickname: user.nickname,
    commonName: user.commonName,
    peerId: user.peerId,
    dmPublicKey: user.dmPublicKey,
    signAlg: config.signAlg,
    hashAlg: config.hashAlg,
  })

  let userCert

  if (rootCA) {
    userCert = await createUserCert(
      rootCA.rootCertString,
      rootCA.rootKeyString,
      userCsr.userCsr,
      notBeforeDate,
      notAfterDate
    )
  }

  return {
    userCsr,
    userCert,
  }
}
