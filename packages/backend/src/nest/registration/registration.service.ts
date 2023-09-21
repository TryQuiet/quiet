import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import { registerUser } from './registration.functions'
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
    this.on(RegistrationEvents.SET_CERTIFICATES, certs => {
      this.setCertificates(certs)
    })
    this.on(RegistrationEvents.REGISTER_USER_CERTIFICATE, async (csr: string) => {
      if (!this._permsData) {
        console.log('NO PERMS DATA')
        return
      }
      await this.registerUserCertificate(csr)
    })
  }

  public setCertificates(certs: string[]) {
    this.certificates = certs
  }

  public set permsData(perms: PermsData) {
    console.log('Setting owner perms data')
    this._permsData = {
      certificate: perms.certificate,
      privKey: perms.privKey,
    }
  }

  public async registerOwnerCertificate(payload: RegisterOwnerCertificatePayload): Promise<void> {
    // It should not be here.
    this._permsData = payload.permsData
    const result = await registerUser(payload.userCsr.userCsr, this._permsData, this.certificates)
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
    const result = await registerUser(csr, this._permsData, this.certificates)
    if (result?.cert) {
      this.emit(RegistrationEvents.NEW_USER, { certificate: result.cert })
    }
  }
}
