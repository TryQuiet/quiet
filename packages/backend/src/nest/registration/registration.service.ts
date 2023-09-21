import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import { registerUser, RegistrarResponse } from './registration.functions'
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
    this._permsData = payload.permsData
    const result = await registerUser(payload.userCsr.userCsr, this._permsData, this.certificates)
    if (result?.status === 200) {
      this.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
        communityId: payload.communityId,
        network: { certificate: result.body.certificate, peers: [] },
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

  public async registerUser(csr: string): Promise<RegistrarResponse> {
    const result = await registerUser(csr, this._permsData, this.certificates)
    if (result?.status === 200) {
      this.emit(RegistrationEvents.NEW_USER, { certificate: result.body.certificate })
    }
    return result
  }
}
