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
import { consoleLogger } from '@quiet/logger'
import { algo } from 'crypto-js'

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
  // console.log(csr)
  console.log(csr.pkcs10.pkcs10.signatureValue)

  // CSR is Valid.
  const uData = new UserCsrData()
  uData.csr = csr.userCsr
  const validationErrors = await validate(userData)
  // Empty strings are valid - what to do about this?

  // Username is valid.
  // Is signed by the right pubKey.
  const algorithm = getAlgorithmParameters('ECDSA', 'verify')

  const pubKey = keyFromCertificate(csr.pkcs10.pkcs10)
  const cryptoKey = await keyObjectFromString(pubKey, crypto.subtle)


  console.log(pubKey)

  // await crypto.subtle.verify(algorithm.algorithm as Algorithm, cryptoKey, csr.pkcs10.pkcs10.signatureValue.valueBlock.valueHexView, csr.userCsr.)
}

// What is BitString

await generateCsr()

