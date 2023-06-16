import { loadCSR, CertFieldsTypes, getReqFieldValue } from '@quiet/identity'
import { registerDecorator, type ValidationArguments, type ValidationOptions } from 'class-validator'
import logger from '../logger'
const log = logger('validators')

export function IsCsr(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) { // eslint-disable-line @typescript-eslint/ban-types
    registerDecorator({
      name: 'isCsr',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, _args: ValidationArguments) {
          const prom = new Promise<boolean>(resolve => {
            loadCSR(value).then(() => {
              resolve(true)
            }, () => {
              resolve(false)
            })
          })
          return await prom
        }
      }
    })
  }
}

export function CsrContainsFields(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) { // eslint-disable-line @typescript-eslint/ban-types
    registerDecorator({
      name: 'csrContainsFields',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, _args: ValidationArguments) {
          const prom = new Promise<boolean>(resolve => {
            loadCSR(value).then((loadedCsr) => {
              for (const certType of [CertFieldsTypes.commonName, CertFieldsTypes.peerId, CertFieldsTypes.nickName]) {
                if (!getReqFieldValue(loadedCsr, certType)) {
                  log.error(`Certificate is lacking a field '${certType}'`)
                  resolve(false)
                  return
                }
              }
              resolve(true)
            }, () => {
              resolve(false)
            })
          })
          return await prom
        }
      }
    })
  }
}
