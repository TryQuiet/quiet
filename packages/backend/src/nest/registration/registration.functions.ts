import { createUserCert, keyFromCertificate } from '@quiet/identity'
import { IsBase64, IsNotEmpty, validate } from 'class-validator'
import { ErrorPayload, PermsData, SocketActionTypes, SuccessfullRegistrarionResponse } from '@quiet/types'
import { CsrContainsFields, IsCsr } from './registration.validators'
import { RegistrationEvents } from './registration.types'
import { loadCSR, CertFieldsTypes, getCertFieldValue, getReqFieldValue, parseCertificate } from '@quiet/identity'
import Logger from '../common/logger'

const logger = Logger('registration.functions')

export class UserCsrData {
  @IsNotEmpty()
  @IsBase64()
  @IsCsr()
  @CsrContainsFields()
  csr: string
}

export class CertificateData {
  @IsNotEmpty()
  @IsBase64()
  certificate: string
}

export interface RegistrarResponse {
  cert: string | null
  error: any
}

export interface RegistrationResponse {
  eventType: RegistrationEvents | SocketActionTypes
  data: ErrorPayload | SuccessfullRegistrarionResponse
}

export const extractPendingCsrs = async (payload: { csrs: string[]; certificates: string[] }) => {
  const certNames = new Set<string>()
  const pendingNames = new Set<string>()
  const parsedUniqueCsrs = new Map<string, string>()
  const pendingCsrs: string[] = []

  payload.certificates.forEach(cert => {
    const parsedCert = parseCertificate(cert)
    const username = getCertFieldValue(parsedCert, CertFieldsTypes.nickName)
    if (username) {
      certNames.add(username)
    }
  })

  for (const csr of payload.csrs.reverse()) {
    const parsedCsr = await loadCSR(csr)
    const pubKey = keyFromCertificate(parsedCsr)
    if (!parsedUniqueCsrs.has(pubKey)) {
      parsedUniqueCsrs.set(pubKey, csr)
    }
  }

  const uniqueCsrsArray = Array.from(parsedUniqueCsrs.values()).reverse()

  for (const csr of uniqueCsrsArray) {
    const parsedCsr = await loadCSR(csr)
    const username = getReqFieldValue(parsedCsr, CertFieldsTypes.nickName)
    if (username && !certNames.has(username) && !pendingNames.has(username)) {
      pendingNames.add(username)
      pendingCsrs.push(csr)
    }
  }
  return pendingCsrs
}

export const validateCsr = async (csr: string) => {
  const userData = new UserCsrData()
  userData.csr = csr
  const validationErrors = await validate(userData)
  return validationErrors
}

/**
 * This function should only be called with pending CSRs (by calling extractPendingCsrs first which prevents signing CSRs for duplicate usernames).
 */
export const issueCertificate = async (userCsr: string, permsData: PermsData): Promise<RegistrarResponse> => {
  const validationErrors = await validateCsr(userCsr)
  if (validationErrors.length > 0) {
    return {
      cert: null,
      error: [validationErrors],
    }
  }
  const userCert = await createUserCert(
    permsData.certificate,
    permsData.privKey,
    userCsr,
    new Date(),
    new Date(2030, 1, 1)
  )
  return {
    cert: userCert.userCertString,
    error: null,
  }
}
