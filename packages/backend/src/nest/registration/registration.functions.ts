import { createUserCert } from '@quiet/identity'
import { IsBase64, IsNotEmpty, validate } from 'class-validator'
import { ErrorPayload, PermsData, SocketActionTypes, SuccessfullRegistrarionResponse } from '@quiet/types'
import { CsrContainsFields, IsCsr } from './registration.validators'
import { RegistrationEvents } from './registration.types'
import Logger from '../common/logger'

const logger = Logger('registration.functions')
class UserCsrData {
  @IsNotEmpty()
  @IsBase64()
  @IsCsr()
  @CsrContainsFields()
  csr: string
}

export interface RegistrarResponse {
  cert: string | null
  error: any
}

export interface RegistrationResponse {
  eventType: RegistrationEvents | SocketActionTypes
  data: ErrorPayload | SuccessfullRegistrarionResponse
}

export const registerUser = async (csr: string, permsData: PermsData): Promise<RegistrarResponse> => {
  const userData = new UserCsrData()
  userData.csr = csr
  const validationErrors = await validate(userData)
  if (validationErrors.length > 0) {
    logger.error(`Received data is not valid: ${validationErrors.toString()}`)
    return {
      cert: null,
      error: JSON.stringify(validationErrors),
    }
  }

  const cert = await issueCertificate(userData.csr, permsData)

  return {
    cert,
    error: null,
  }
}

export const issueCertificate = async (userCsr: string, permsData: PermsData): Promise<string> => {
  const userCert = await createUserCert(
    permsData.certificate,
    permsData.privKey,
    userCsr,
    new Date(),
    new Date(2030, 1, 1)
  )
  return userCert.userCertString
}
