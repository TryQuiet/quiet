import { loadCSR } from '@zbayapp/identity'
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

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
