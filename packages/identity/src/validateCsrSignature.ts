import { setEngine, CryptoEngine } from 'pkijs'
import { Crypto } from '@peculiar/webcrypto'
import config from './config'
import { createUserCsr } from './createUserCsr'

const validateCsrSignature = async () => {
  const webcrypto = new Crypto()
  // @ts-ignore
  global.crypto = webcrypto

  setEngine(
    'newEngine',
    new CryptoEngine({
      name: 'newEngine',
      // @ts-ignore
      crypto: webcrypto,
    })
  )

  const userData = {
    nickname: 'dev99damian1',
    commonName: 'sdf',
    peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLert',
    dmPublicKey: 'dmPublicKey1',
    signAlg: config.signAlg,
    hashAlg: config.hashAlg,
  }

  const csr = await createUserCsr(userData)

  const certificationRequest = csr.pkcs10.pkcs10

  const publicKeyBuffer = certificationRequest.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHexView.buffer

  const publicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'ECDSA',
      namedCurve: "P-256"
    },
    true,
    ['verify']
  )

  const data = certificationRequest.tbsView

  const signature = new Uint8Array(certificationRequest.signatureValue.valueBlock.valueHexView).buffer

  // const algorithm = getAlgorithmParameters('ECDSA', 'verify')
  const algorithm = { name: 'ECDSA', hash: { name: 'SHA-256' } }

  // await verifySignature(signature, data, publicKey)
  const isValid = await crypto.subtle.verify(algorithm, publicKey, signature, data)
}

validateCsrSignature()