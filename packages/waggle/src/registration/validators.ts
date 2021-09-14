import { loadCSR } from '@zbayapp/identity'
import { CertFieldsTypes, getReqFieldValue } from '@zbayapp/identity/lib/common'
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

import debug from 'debug'
const log = Object.assign(debug('waggle:validators'), {
  error: debug('waggle:validators:err')
})

export function IsCsr(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCsr',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, _args: ValidationArguments) {
          const prom: Promise<boolean> = new Promise(resolve => {
            loadCSR(value).then(() => {
              resolve(true)
            }, () => {
              resolve(false)
            })
          })
          return prom
        }
      }
    })
  }
}

export function CsrContainsFields(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'csrContainsFields',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, _args: ValidationArguments) {
          const prom: Promise<boolean> = new Promise(resolve => {
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
          return prom
        }
      }
    })
  }
}
