import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import { registerUser } from './registration.functions'
import { ErrorCodes, ErrorMessages, PermsData, RegisterOwnerCertificatePayload, SocketActionTypes } from '@quiet/types'
import { RegistrationEvents } from './registration.types'
import Logger from '../common/logger'
import { loadCSR, CertFieldsTypes, getCertFieldValue, getReqFieldValue, parseCertificate } from '@quiet/identity'
@Injectable()
export class RegistrationService extends EventEmitter implements OnModuleInit {
  private readonly logger = Logger(RegistrationService.name)
  public certificates: string[] = []
  private _permsData: PermsData

  constructor() {
    super()
  }

  onModuleInit() {
    this.on(
      RegistrationEvents.REGISTER_USER_CERTIFICATE,
      async (payload: { csrs: string[]; certificates: string[] }) => {
        // That means that we are not the owner of the community
        if (!this._permsData) return
        await this.issueCertificates(payload)
      }
    )
  }

  private async issueCertificates(payload: { csrs: string[]; certificates: string[] }) {
    const certNames: string[] = []
    const pendingNames: string[] = []

    payload.certificates.forEach(cert => {
      // we probably should cache that
      const parsedCert = parseCertificate(cert)
      const username = getCertFieldValue(parsedCert, CertFieldsTypes.nickName)
      console.log('certificates ')
      if (!username) return false
      certNames.push(username)
    })

    // Change type to CertificationRequest
    const parsedCsrs: { [key: string]: any } = {}

    for (const csr of payload.csrs) {
      const parsedCsr = await loadCSR(csr)
      parsedCsrs[csr] = parsedCsr
    }

    const pendingCsrs = payload.csrs.filter(csr => {
      // we probably should cache that
      const username = getReqFieldValue(parsedCsrs[csr], CertFieldsTypes.nickName)

      if (!username) return false
      if (certNames.includes(username)) return false
      if (pendingNames.includes(username)) return false
      pendingNames.push(username)
      return true
    })

    console.log('pending csrs', pendingCsrs)

    pendingCsrs.forEach(async csr => {
      await this.registerUserCertificate(csr)
    })
  }

  public set permsData(perms: PermsData) {
    this._permsData = {
      certificate: perms.certificate,
      privKey: perms.privKey,
    }
  }

  public async registerOwnerCertificate(payload: RegisterOwnerCertificatePayload): Promise<void> {
    // It should not be here.
    this._permsData = payload.permsData
    const result = await registerUser(payload.userCsr.userCsr, this._permsData)
    if (result?.cert) {
      this.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
        communityId: payload.communityId,
        network: { certificate: result.cert, peers: [] },
      })
    } else {
      this.emit(SocketActionTypes.ERROR, {
        type: SocketActionTypes.REGISTRAR,
        code: ErrorCodes.SERVER_ERROR,
        message: ErrorMessages.REGISTRATION_FAILED,
        community: payload.communityId,
      })
    }
  }

  public async registerUserCertificate(csr: string): Promise<void> {
    const result = await registerUser(csr, this._permsData)
    if (result?.cert) {
      this.emit(RegistrationEvents.NEW_USER, { certificate: result.cert })
    }
  }
}
