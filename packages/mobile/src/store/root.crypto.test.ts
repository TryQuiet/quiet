import { runSaga } from 'redux-saga'
import { getCrypto, setEngine } from 'pkijs'
import {
  createTestRootCA,
  createTestUserCsr,
  createTestUserCert,
  extractPubKey,
  sign,
  verifySignature,
  verifyUserCert,
} from '@quiet/identity'
import { rootSaga } from './root.saga'

describe('mobile crypto initialization', () => {
  it('provides the identity engine with certificate and signature operations', async () => {
    const root = await createTestRootCA()
    const user = await createTestUserCsr()
    const certificate = await createTestUserCert(root, user)
    const verification = await verifyUserCert(root.rootCertString, certificate.userCertString)
    expect(verification.result).toBe(true)

    const publicKey = await extractPubKey(certificate.userCertString, global.crypto.subtle)
    const signature = await sign('Quiet migration check', user.pkcs10.privateKey)
    await expect(verifySignature(signature, 'Quiet migration check', publicKey)).resolves.toBe(true)
    await expect(verifySignature(signature, 'Modified message', publicKey)).resolves.toBe(false)
  })

  it('initializes a complete PKI engine before waiting for the store', async () => {
    setEngine('uninitialized', undefined)
    expect(() => getCrypto(true)).toThrow('Unable to create WebCrypto object')

    const task = runSaga({}, rootSaga)
    try {
      const engine = getCrypto(true)
      const keys = await engine.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])

      const data = new Uint8Array([1, 2, 3])
      const signAlgorithm = { name: 'ECDSA', hash: 'SHA-256' }
      const signature = await engine.sign(signAlgorithm, keys.privateKey, data)
      await expect(engine.verify(signAlgorithm, keys.publicKey, signature, data)).resolves.toBe(true)
      await expect(engine.verify(signAlgorithm, keys.publicKey, signature, new Uint8Array([1, 2, 4]))).resolves.toBe(
        false
      )
    } finally {
      task.cancel()
      await task.toPromise()
    }
  })
})
