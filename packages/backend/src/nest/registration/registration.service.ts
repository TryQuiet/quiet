import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import { extractPendingCsrs, issueCertificate } from './registration.functions'
import { ErrorCodes, ErrorMessages, PermsData, RegisterOwnerCertificatePayload, SocketActionTypes } from '@quiet/types'
import { RegistrationEvents } from './registration.types'
import Logger from '../common/logger'

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
        // Lack of permsData means that we are not the owner of the community
        await this.issueCertificates(payload)
      }
    )
  }

  private async issueCertificates(payload: { csrs: string[]; certificates: string[] }) {
    if (!this._permsData) return
    const pendingCsrs = await extractPendingCsrs(payload)
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
    const result = await issueCertificate(payload.userCsr.userCsr, this._permsData)
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
    const result = await issueCertificate(csr, this._permsData)
    if (result?.cert) {
      this.emit(RegistrationEvents.NEW_USER, { certificate: result.cert })
    }
  }
}
