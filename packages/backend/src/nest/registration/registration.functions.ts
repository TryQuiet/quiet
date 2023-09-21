import {
  createUserCert,
  loadCSR,
  CertFieldsTypes,
  getReqFieldValue,
  keyFromCertificate,
  parseCertificate,
  getCertFieldValue,
} from '@quiet/identity'
import { IsBase64, IsNotEmpty, validate } from 'class-validator'
import { CertificationRequest } from 'pkijs'
import { getUsersAddresses } from '../common/utils'
import { ErrorPayload, PermsData, SocketActionTypes, SuccessfullRegistrarionResponse, UserData } from '@quiet/types'
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
  status: number
  body: any
}

// REFACTORING: Move this method to identity package
export const pubKeyMatch = (cert: string, parsedCsr: CertificationRequest): boolean => {
  const parsedCertificate = parseCertificate(cert)
  const pubKey = keyFromCertificate(parsedCertificate)
  const pubKeyCsr = keyFromCertificate(parsedCsr)

  if (pubKey === pubKeyCsr) {
    return true
  }
  return false
}

export const registerOwner = async (userCsr: string, permsData: PermsData): Promise<string> => {
  const userData = new UserCsrData()
  userData.csr = userCsr
  const validationErrors = await validate(userData)
  if (validationErrors.length > 0) {
    throw new Error(`Validation errors: ${validationErrors}`)
  }
  const userCert = await createUserCert(
    permsData.certificate,
    permsData.privKey,
    userCsr,
    new Date(),
    new Date(2030, 1, 1)
  )
  return userCert.userCertString
}

const certificateByUsername = (username: string, certificates: string[]): string | null => {
  /**
   * Check if given username is already in use
   */
  for (const cert of certificates) {
    const parsedCert = parseCertificate(cert)
    const certUsername = getCertFieldValue(parsedCert, CertFieldsTypes.nickName)
    if (certUsername?.localeCompare(username, undefined, { sensitivity: 'base' }) === 0) {
      return cert
    }
  }
  return null
}

export interface RegistrationResponse {
  eventType: RegistrationEvents | SocketActionTypes
  data: ErrorPayload | SuccessfullRegistrarionResponse
}

export const registerUser = async (
  csr: string,
  permsData: PermsData,
  certificates: string[],
  ownerCertificate: string
): Promise<RegistrarResponse> => {
  let cert: string
  const userData = new UserCsrData()
  userData.csr = csr
  const validationErrors = await validate(userData)
  if (validationErrors.length > 0) {
    logger.error(`Received data is not valid: ${validationErrors.toString()}`)
    return {
      status: 400,
      body: JSON.stringify(validationErrors),
    }
  }

  const parsedCsr = await loadCSR(userData.csr)
  const username = getReqFieldValue(parsedCsr, CertFieldsTypes.nickName)
  if (!username) {
    logger.error(`Could not parse certificate for field type ${CertFieldsTypes.nickName}`)
    return {
      // Should be internal server error code 500
      status: 400,
      body: null,
    }
  }
  // Use map here
  const usernameCert = certificateByUsername(username, certificates)
  if (usernameCert) {
    if (!pubKeyMatch(usernameCert, parsedCsr)) {
      logger(`Username ${username} is taken`)
      return {
        // Should be conflict code 409
        status: 403,
        body: null,
      }
    } else {
      logger('Requesting same CSR again')
      cert = usernameCert
    }
  } else {
    logger('username doesnt have existing cert, creating new')
    try {
      cert = await registerCertificate(userData.csr, permsData)
    } catch (e) {
      logger.error(`Something went wrong with registering user: ${e.message as string}`)
      return {
        // Should be internal server error code 500
        status: 400,
        body: null,
      }
    }
  }

  const allUsers: UserData[] = []
  for (const cert of certificates) {
    const parsedCert = parseCertificate(cert)
    const onionAddress = getCertFieldValue(parsedCert, CertFieldsTypes.commonName)
    const peerId = getCertFieldValue(parsedCert, CertFieldsTypes.peerId)
    const username = getCertFieldValue(parsedCert, CertFieldsTypes.nickName)
    const dmPublicKey = getCertFieldValue(parsedCert, CertFieldsTypes.dmPublicKey)
    if (!onionAddress || !peerId || !username || !dmPublicKey) continue
    allUsers.push({ onionAddress, peerId, username, dmPublicKey })
  }

  const peerList = await getUsersAddresses(allUsers)

  return {
    status: 200,
    body: {
      certificate: cert,
      peers: peerList,
      rootCa: permsData.certificate,
      ownerCert: ownerCertificate,
    },
  }
}

export const registerCertificate = async (userCsr: string, permsData: PermsData): Promise<string> => {
  const userCert = await createUserCert(
    permsData.certificate,
    permsData.privKey,
    userCsr,
    new Date(),
    new Date(2030, 1, 1)
  )
  return userCert.userCertString
}
