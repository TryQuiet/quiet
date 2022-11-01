import { createUserCert, UserCert, loadCSR, CertFieldsTypes, getReqFieldValue, keyFromCertificate, parseCertificate } from '@quiet/identity'
import { SaveCertificatePayload, PermsData } from '@quiet/state-manager'
import { IsBase64, IsNotEmpty, validate } from 'class-validator'
import { CertificationRequest } from 'pkijs'

import logger from '../logger'
import { Storage } from '../storage'
import { CsrContainsFields, IsCsr } from './validators'
const log = logger('registration')

class UserCsrData {
    @IsNotEmpty()
    @IsBase64()
    @IsCsr()
    @CsrContainsFields()
    csr: string
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

  export const registerOwner = async (userCsr: string, permsData: PermsData): Promise<string|null> => {
    const userData = new UserCsrData()
    userData.csr = userCsr
    const validationErrors = await validate(userData)
    if (validationErrors.length > 0) return null
    const userCert = await createUserCert(
      permsData.certificate,
      permsData.privKey,
      userCsr,
      new Date(),
      new Date(2030, 1, 1)
    )
    return userCert.userCertString
  }

  export const registerUser = async (csr: string, permsData: PermsData, storage: Storage, peerList: string[]): Promise<{status:number, body:any}> => {
    let cert: string
    const userData = new UserCsrData()
    userData.csr = csr
    const validationErrors = await validate(userData)
    if (validationErrors.length > 0) {
      log.error(`Received data is not valid: ${validationErrors.toString()}`)
      return {
        status: 400,
        body: JSON.stringify(validationErrors)
      }
    }

    const parsedCsr = await loadCSR(userData.csr)
    const username = getReqFieldValue(parsedCsr, CertFieldsTypes.nickName)
    const usernameCert = storage.usernameCert(username)
    if (usernameCert) {
      if (!pubKeyMatch(usernameCert, parsedCsr)) {
        log(`Username ${username} is taken`)
        return {
          // Should be conflict code 409
          status: 403,
          body: null
        }
      } else {
        log('Requesting same CSR again')
        cert = usernameCert
      }
    }

    if (!usernameCert) {
      log('username doesnt have existing cert, creating new')
      try {
        cert = await registerCertificate(userData.csr, permsData, storage)
      } catch (e) {
        log.error(`Something went wrong with registering user: ${e.message as string}`)
        return {
          // Should be internal server error code 500
          status: 400,
          body: null
        }
      }
    }

    return {
      status: 200,
      body: {
        certificate: cert,
        peers: peerList,
        rootCa: permsData.certificate
      }
    }
  }

  export const saveCertToDb = async (userCert: string, permsData: PermsData, storage: Storage): Promise<string> => {
    const payload: SaveCertificatePayload = {
      certificate: userCert,
      rootPermsData: permsData
    }
    const certSaved = await storage.saveCertificate(payload)
    if (!certSaved) {
      throw new Error('Could not save certificate')
    }
    log('Saved owner certificate')
    return userCert
  }

 export const registerCertificate = async (userCsr: string, permsData: PermsData, storage: Storage): Promise<string>  => {
    const userCert = await createUserCert(
      permsData.certificate,
      permsData.privKey,
      userCsr,
      new Date(),
      new Date(2030, 1, 1)
    )

    return await saveCertToDb(userCert.userCertString, permsData, storage)
  }