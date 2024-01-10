import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import { extractPendingCsrs, issueCertificate } from './registration.functions'
import { ErrorCodes, ErrorMessages, PermsData, RegisterOwnerCertificatePayload, SocketActionTypes } from '@quiet/types'
import { RegistrationEvents } from './registration.types'
import Logger from '../common/logger'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class RegistrationService extends EventEmitter implements OnModuleInit {
  private readonly logger = Logger(RegistrationService.name)
  public certificates: string[] = []
  private _permsData: PermsData
  private _storageService: StorageService
  private registrationEvents: { csrs: string[] }[] = []
  private registrationEventInProgress = false

  constructor() {
    super()
  }

  onModuleInit() {
    this.on(
      RegistrationEvents.REGISTER_USER_CERTIFICATE,
      async (payload: { csrs: string[] }) => {
        this.registrationEvents.push(payload)
        await this.tryIssueCertificates()
      }
    )
  }

  public async tryIssueCertificates() {
    console.log("Trying issue certificates", this.registrationEventInProgress, this.registrationEvents)
    if (!this.registrationEventInProgress) {
      const event = this.registrationEvents.shift()
      if (event) {
        console.log("Running issue certificates", event)
        this.registrationEventInProgress = true
        await this.issueCertificates({
          ...event,
          // @ts-ignore
          certificates: await this._storageService.certificatesStore.loadAllCertificates() as string[],
        })
      }
    }
  }

  public async finishIssueCertificates() {
    console.log("Finished issue certificates")
    this.registrationEventInProgress = false

    if (this.registrationEvents.length > 0) {
      setTimeout(this.tryIssueCertificates.bind(this), 0)
    }
  }

  private async issueCertificates(payload: { csrs: string[]; certificates: string[] }) {
    // Lack of permsData means that we are not the owner of the
    // community in the official model of the app, however anyone can
    // modify the source code, put malicious permsData here, issue
    // false certificates and try to trick other users. To prevent
    // that, peers verify that anything that is written to the
    // certificate store is signed by the owner.
    if (!this._permsData) {
      await this.finishIssueCertificates()
      return
    }

    this.logger('DuplicatedCertBug', { payload })
    const pendingCsrs = await extractPendingCsrs(payload)
    this.logger('DuplicatedCertBug', { pendingCsrs })
    await Promise.all(
      pendingCsrs.map(async csr => {
        await this.registerUserCertificate(csr)
      })
    )

    await this.finishIssueCertificates()
  }

  public set permsData(perms: PermsData) {
    this._permsData = {
      certificate: perms.certificate,
      privKey: perms.privKey,
    }
  }

  public set storageService(storage: StorageService) {
    this._storageService = storage
  }

  public async registerOwnerCertificate(payload: RegisterOwnerCertificatePayload): Promise<void> {
    // FIXME: We should resolve problems with events order and we should set permsData only on LAUNCH_REGISTRART socket event in connectionsManager.
    this._permsData = payload.permsData
    const result = await issueCertificate(payload.userCsr.userCsr, this._permsData)
    if (result?.cert) {
      this.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
        communityId: payload.communityId,
        network: { certificate: result.cert },
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
    this.logger('DuplicatedCertBug', { result })
    if (result?.cert) {
      // @ts-ignore
      await this._storageService?.saveCertificate({ certificate: result.cert })
    }
  }
}
