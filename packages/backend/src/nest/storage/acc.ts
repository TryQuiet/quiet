import { setEngine, CryptoEngine, getAlgorithmParameters } from 'pkijs'
import { Crypto } from '@peculiar/webcrypto'
import { IsBase64, IsNotEmpty, validate } from 'class-validator'
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import {
  CertFieldsTypes,
  getCertFieldValue,
  keyFromCertificate,
  keyObjectFromString,
  parseCertificate,
  verifySignature,
  verifyUserCert,
  parseCertificationRequest,
  getReqFieldValue,
  createUserCsr,
  configCrypto,
  loadCSR
} from '@quiet/identity'

const config = {
  signAlg: 'ECDSA',
  hashAlg: 'sha-256',
}


export function IsCsr(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCsr',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, _args: ValidationArguments) {
          const prom: Promise<boolean> = new Promise(resolve => {
            loadCSR(value).then(
              () => {
                resolve(true)
              },
              () => {
                resolve(false)
              }
            )
          })
          return await prom
        },
      },
    })
  }
}

export function CsrContainsFields(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'csrContainsFields',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, _args: ValidationArguments) {
          const prom: Promise<boolean> = new Promise(resolve => {
            loadCSR(value).then(
              loadedCsr => {
                for (const certType of [CertFieldsTypes.commonName, CertFieldsTypes.peerId, CertFieldsTypes.nickName]) {
                  if (!getReqFieldValue(loadedCsr, certType)) {
                    console.error(`Certificate is lacking a field '${certType}'`)
                    resolve(false)
                    return
                  }
                }
                resolve(true)
              },
              () => {
                resolve(false)
              }
            )
          })
          return await prom
        },
      },
    })
  }
}

class UserCsrData {
  @IsNotEmpty()
  @IsBase64()
  @IsCsr()
  @CsrContainsFields()
  csr: string
}

console.log('----- acc -----')

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

const main = async () => {
  const csr = await generateCsr()
  // await validateCsr(csr.userCsr)
  await verifyCSRSignature(csr.userCsr)
}

const generateCsr = async () => {
  const userData = {
    nickname: 'dev99damian1',
    commonName: 'sdf',
    peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLert',
    dmPublicKey: 'dmPublicKey1',
    signAlg: configCrypto.signAlg,
    hashAlg: configCrypto.hashAlg,
  }

  const csr = await createUserCsr(userData)

  return csr

  // Username is valid.
  // Is signed by the right pubKey.
  // const algorithm = getAlgorithmParameters('ECDSA', 'verify')
}

export const validateCsr = async (csr: string) => {
  const userData = new UserCsrData()
  userData.csr = csr
  const validationErrors = await validate(userData)
  return validationErrors
}

const verifyCSRSignature = async (csr: string) => {
  const certificationRequest = parseCertificationRequest(csr)
  console.log('vs')
  const pubkey = await certificationRequest.getPublicKey()
  // const publicKeyBuffer = certificationRequest.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHexView.buffer
  // const cryptoKey = await keyObjectFromString(pubKey, crypto.subtle)
  console.log(pubkey)
  // const publicKey = await crypto.subtle.importKey(
  //   'spki',
  //   publicKeyBuffer,
  //   {
  //     name: 'ECDSA',
  //     namedCurve: "P-256"
  //   },
  //   true,
  //   ['verify']
  // )

  // const data = certificationRequest.tbsView

  // const signature = new Uint8Array(certificationRequest.signatureValue.valueBlock.valueHexView).buffer

  // const algorithm = { name: 'ECDSA', hash: { name: 'SHA-256' } }

  // await verifySignature(signature, data, publicKey)
  // const isValid = await crypto.subtle.verify(algorithm, publicKey, signature, data)
}

await main()