import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import { registerOwner, registerUser } from './registration.functions'
import { ErrorCodes, ErrorMessages, PermsData, RegisterOwnerCertificatePayload, SocketActionTypes } from '@quiet/types'
import { RegistrationEvents } from './registration.types'
import Logger from '../common/logger'

@Injectable()
export class RegistrationService extends EventEmitter implements OnModuleInit {
  private readonly logger = Logger(RegistrationService.name)
  public certificates: string[] = []
  private _permsData: PermsData
  private _ownerCertificate: string

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
      await this.registerUser(csr)
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
    let cert: string
    try {
      cert = await registerOwner(payload.userCsr.userCsr, payload.permsData)
    } catch (e) {
      this.logger.error(`Registering owner failed: ${e.message}`)
      this.emit(SocketActionTypes.ERROR, {
        type: SocketActionTypes.REGISTRAR,
        code: ErrorCodes.SERVER_ERROR,
        message: ErrorMessages.REGISTRATION_FAILED,
        community: payload.communityId,
      })
      return
    }
    this.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
      communityId: payload.communityId,
      network: { certificate: cert, peers: [] },
    })
    this._ownerCertificate = cert
  }

  public async registerUser(csr: string): Promise<{ status: number; body: any }> {
    const result = await registerUser(csr, this._permsData, this.certificates, this._ownerCertificate)
    if (result?.status === 200) {
      this.emit(RegistrationEvents.NEW_USER, { certificate: result.body.certificate, rootPermsData: this._permsData })
    }
    return result
  }
}
