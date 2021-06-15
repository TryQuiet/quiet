import { Time, setEngine, CryptoEngine, getCrypto } from 'pkijs'

import { signing } from './tests/sign'
import { extractPubKey } from './tests/extractPubKey'
import { verifySignature } from './tests/verification'
import { createRootCA } from './generatePems/generateRootCA'
import { createUserCsr } from './generatePems/requestCertificate'
import { createUserCert } from './generatePems/generateUserCertificate'
import { Crypto } from '@peculiar/webcrypto'

describe('verify sign', () => {
  let crypto
  beforeAll(() => {
    const webcrypto = new Crypto()
    setEngine('newEngine', webcrypto, new CryptoEngine({
      name: '',
      crypto: webcrypto,
      subtle: webcrypto.subtle
    }))
    crypto = getCrypto()
  })

  it('verification test', async () => {
    const message = 'hello'
    const userData = {
      zbayNickname: 'dev99damian',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6'
    }
    const notBeforeDate = new Date()
    const notAfterDate = new Date(2030, 1, 1)

    const rootCert = await createRootCA(new Time({ type: 1, value: notBeforeDate }), new Time({ type: 1, value: notAfterDate }))
    const user = await createUserCsr(userData)
    const userCert = await createUserCert(rootCert.rootCertString, rootCert.rootKeyString, user.userCsr, notBeforeDate, notAfterDate)

    const data = {
      message: message,
      userPubKey: await extractPubKey(userCert.userCertString, crypto),
      signature: await signing(message, user.pkcs10.privateKey)
    }

    const result = await verifySignature(data.userPubKey, data.signature, data.message)

    expect(result).toBe(true)
  })
})
