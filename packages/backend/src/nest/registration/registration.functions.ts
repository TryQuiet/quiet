import {
  createUserCert,
  loadCSR,
  CertFieldsTypes,
  getReqFieldValue,
  certificateByUsername,
  pubKeyMatch,
} from '@quiet/identity'
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

export const registerUser = async (
  csr: string,
  permsData: PermsData,
  certificates: string[]
): Promise<RegistrarResponse> => {
  let cert: string

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

  const parsedCsr = await loadCSR(userData.csr)

  const username = getReqFieldValue(parsedCsr, CertFieldsTypes.nickName)
  if (!username) {
    logger.error(`Could not parse certificate for field type ${CertFieldsTypes.nickName}`)
    return {
      cert: null,
      error: null,
    }
  }
  // Use map here
  const usernameCert = certificateByUsername(username, certificates)
  if (usernameCert) {
    if (!pubKeyMatch(usernameCert, parsedCsr)) {
      logger(`Username ${username} is taken`)
      return {
        cert: null,
        error: null,
      }
    } else {
      logger('Requesting same CSR again')
      cert = usernameCert
    }
  } else {
    logger('username doesnt have existing cert, creating new')
    try {
      cert = await issueCertificate(userData.csr, permsData)
    } catch (e) {
      logger.error(`Something went wrong with registering user: ${e.message as string}`)
      return {
        cert: null,
        error: null,
      }
    }
  }

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
