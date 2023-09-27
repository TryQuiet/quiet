import { createUserCert } from '@quiet/identity'
import { IsBase64, IsNotEmpty, validate } from 'class-validator'
import { ErrorPayload, PermsData, SocketActionTypes, SuccessfullRegistrarionResponse } from '@quiet/types'
import { CsrContainsFields, IsCsr } from './registration.validators'
import { RegistrationEvents } from './registration.types'
import { loadCSR, CertFieldsTypes, getCertFieldValue, getReqFieldValue, parseCertificate } from '@quiet/identity'
import { CertificationRequest } from 'pkijs'
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

export const extractPendingCsrs = async (payload: { csrs: string[]; certificates: string[] }) => {
  const certNames: string[] = []
  const pendingNames: string[] = []

  payload.certificates.forEach(cert => {
    const parsedCert = parseCertificate(cert)
    const username = getCertFieldValue(parsedCert, CertFieldsTypes.nickName)
    if (!username) return false
    certNames.push(username)
  })

  const parsedCsrs: { [key: string]: CertificationRequest } = {}

  for (const csr of payload.csrs) {
    const parsedCsr = await loadCSR(csr)
    parsedCsrs[csr] = parsedCsr
  }

  const pendingCsrs = payload.csrs.filter(csr => {
    const username = getReqFieldValue(parsedCsrs[csr], CertFieldsTypes.nickName)

    if (!username) return false
    if (certNames.includes(username)) return false
    if (pendingNames.includes(username)) return false
    pendingNames.push(username)
    return true
  })

  return pendingCsrs
}

export const validateCsr = async (csr: string) => {
  const userData = new UserCsrData()
  userData.csr = csr
  const validationErrors = await validate(userData)
  return validationErrors
}

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
