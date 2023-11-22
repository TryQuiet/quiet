import { loadCSR, CertFieldsTypes, getReqFieldValue } from '@quiet/identity'
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import Logger from '../common/logger'

const logger = Logger('registration.validators')
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
                                for (const certType of [
                                    CertFieldsTypes.commonName,
                                    CertFieldsTypes.peerId,
                                    CertFieldsTypes.nickName,
                                ]) {
                                    if (!getReqFieldValue(loadedCsr, certType)) {
                                        logger.error(`Certificate is lacking a field '${certType}'`)
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
