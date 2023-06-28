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
import { type CertificationRequest } from 'pkijs'
import { type Agent } from 'http'
import AbortController from 'abort-controller'
import fetch, { type Response } from 'node-fetch'
import logger from '../logger'
import { CsrContainsFields, IsCsr } from './validators'
import { RegistrationEvents } from './types'

import { getUsersAddresses } from '../common/utils'
import {
  ErrorCodes,
  ErrorMessages,
  type ErrorPayload,
  type PermsData,
  SocketActionTypes,
  type SuccessfullRegistrarionResponse,
  type User,
  type UserCertificatePayload,
} from '@quiet/types'
const log = logger('registration')

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

export const sendCertificateRegistrationRequest = async (
  serviceAddress: string,
  userCsr: string,
  communityId: string,
  requestTimeout = 120000,
  socksProxyAgent: Agent
): Promise<RegistrationResponse> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, requestTimeout)

  let options = {
    method: 'POST',
    body: JSON.stringify({ data: userCsr }),
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  }

  options = Object.assign(
    {
      agent: socksProxyAgent,
    },
    options
  )

  let response: Response | null = null

  try {
    const start = new Date()
    response = await fetch(`${serviceAddress}/register`, options)
    const end = new Date()
    const fetchTime = (end.getTime() - start.getTime()) / 1000
    log(`Fetched ${serviceAddress}, time: ${fetchTime}`)
  } catch (e) {
    log.error(e)
    return {
      eventType: RegistrationEvents.ERROR,
      data: {
        type: SocketActionTypes.REGISTRAR,
        code: ErrorCodes.NOT_FOUND,
        message: ErrorMessages.REGISTRAR_NOT_FOUND,
        community: communityId,
      },
    }
  } finally {
    clearTimeout(timeout)
  }

  switch (response?.status) {
    case 200:
      break
    case 400:
      return {
        eventType: RegistrationEvents.ERROR,
        data: {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.BAD_REQUEST,
          message: ErrorMessages.INVALID_USERNAME,
          community: communityId,
        },
      }
    case 403:
      return {
        eventType: RegistrationEvents.ERROR,
        data: {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.FORBIDDEN,
          message: ErrorMessages.USERNAME_TAKEN,
          community: communityId,
        },
      }
    case 404:
      return {
        eventType: RegistrationEvents.ERROR,
        data: {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.NOT_FOUND,
          message: ErrorMessages.REGISTRAR_NOT_FOUND,
          community: communityId,
        },
      }
    default:
      log.error(`Registrar responded with ${response?.status} "${response?.statusText}" (${communityId})`)
      return {
        eventType: RegistrationEvents.ERROR,
        data: {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.SERVER_ERROR,
          message: ErrorMessages.REGISTRATION_FAILED,
          community: communityId,
        },
      }
  }

  const registrarResponse: UserCertificatePayload = await response.json()

  log(`Sending user certificate (${communityId})`)
  return {
    eventType: SocketActionTypes.SEND_USER_CERTIFICATE,
    data: {
      communityId,
      payload: registrarResponse,
    },
  }
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
    log.error(`Received data is not valid: ${validationErrors.toString()}`)
    return {
      status: 400,
      body: JSON.stringify(validationErrors),
    }
  }

  const parsedCsr = await loadCSR(userData.csr)
  const username = getReqFieldValue(parsedCsr, CertFieldsTypes.nickName)
  if (!username) {
    log.error(`Could not parse certificate for field type ${CertFieldsTypes.nickName}`)
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
      log(`Username ${username} is taken`)
      return {
        // Should be conflict code 409
        status: 403,
        body: null,
      }
    } else {
      log('Requesting same CSR again')
      cert = usernameCert
    }
  } else {
    log('username doesnt have existing cert, creating new')
    try {
      cert = await registerCertificate(userData.csr, permsData)
    } catch (e) {
      log.error(`Something went wrong with registering user: ${e.message as string}`)
      return {
        // Should be internal server error code 500
        status: 400,
        body: null,
      }
    }
  }

  const allUsers: User[] = []
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
