import { Time, getCrypto, Certificate } from 'pkijs'

import { createUserCert, createUserCsr, createRootCA, configCrypto } from '@zbayapp/identity'
import { RootCA } from '@zbayapp/identity/lib/generateRootCA'

// ---------------------------- section with creating pems

export function dumpPEM(tag: string, body: string | Certificate | CryptoKey) {
  let result
  if (typeof body === 'string') {
    result = (
      `-----BEGIN ${tag}-----\n` +
      `${formatPEM(body)}\n` +
      `-----END ${tag}-----\n`
    )
  } else {
    result = (
      `-----BEGIN ${tag}-----\n` +
      `${formatPEM(Buffer.from(body).toString('base64'))}\n` +
      `-----END ${tag}-----\n`
    )
  }

  return Buffer.from(result)
}

function formatPEM(pemString: string) {
  const stringLength = pemString.length
  let resultString = ''
  for (let i = 0, count = 0; i < stringLength; i++, count++) {
    if (count > 63) {
      resultString = `${resultString}\n`
      count = 0
    }
    resultString = `${resultString}${pemString[i]}`
  }
  return resultString
}

export const createUsersCerts = async (onion: string, rootCert: RootCA): Promise<{ userCert: Buffer, userKey: Buffer }> => {
  const userData = {
    zbayNickname: 'dev99damian1',
    commonName: onion,
    peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLert',
    dmPublicKey: 'dmPublicKey1',
    signAlg: configCrypto.signAlg,
    hashAlg: configCrypto.hashAlg
  }

  const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
  const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))

  const user = await createUserCsr(userData)
  const userCert = await createUserCert(rootCert.rootCertString, rootCert.rootKeyString, user.userCsr, notBeforeDate, notAfterDate)

  return {
    userCert: dumpPEM('CERTIFICATE', userCert.userCertObject.certificate.toSchema(true).toBER(false)),
    userKey: dumpPEM('PRIVATE KEY', await getCrypto().exportKey('pkcs8', user.pkcs10.privateKey))
  }
}

export const createCertificatesTestHelper = async (onion1, onion2) => {
  const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
  const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))
  const rootCert = await createRootCA(new Time({ type: 0, value: notBeforeDate }), new Time({ type: 0, value: notAfterDate }))

  const userData1 = await createUsersCerts(onion1, rootCert)
  const userData2 = await createUsersCerts(onion2, rootCert)

  const pems = {
    ca: dumpPEM('CERTIFICATE', rootCert.rootObject.certificate.toSchema(true).toBER(false)),
    ca_key: dumpPEM('PRIVATE KEY', await getCrypto().exportKey('pkcs8', rootCert.rootObject.privateKey)),

    servCert: userData1.userCert,
    servKey: userData1.userKey,

    userCert: userData2.userCert,
    userKey: userData2.userKey
  }

  return pems
}
