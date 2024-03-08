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
  private permsData: PermsData
  private storageService: StorageService
  private registrationEvents: { csrs: string[] }[] = []
  private registrationEventInProgress = false

  constructor() {
    super()
  }

  onModuleInit() {
    this.on(RegistrationEvents.REGISTER_USER_CERTIFICATE, async (payload: { csrs: string[] }) => {
      // Save the registration event and then try to process it, but
      // since we only process a single event at a time, it might not
      // get processed until other events have been processed.
      this.registrationEvents.push(payload)
      await this.tryIssueCertificates()
    })
  }

  public init(storageService: StorageService) {
    this.storageService = storageService
  }

  public setPermsData(permsData: PermsData) {
    this.permsData = permsData
  }

  public async tryIssueCertificates() {
    this.logger('Trying to issue certificates', this.registrationEventInProgress, this.registrationEvents)
    // Process only a single registration event at a time so that we
    // do not register two certificates with the same name.
    if (!this.registrationEventInProgress) {
      // Get the next event.
      const event = this.registrationEvents.shift()
      if (event) {
        this.logger('Issuing certificates', event)
        // Event processing in progress
        this.registrationEventInProgress = true

        // Await the processing function and make sure everything that
        // needs to be done in order is awaited inside this function.
        await this.issueCertificates({
          ...event,
          certificates: (await this.storageService?.loadAllCertificates()) as string[],
        })

        this.logger('Finished issuing certificates')
        // Event processing finished
        this.registrationEventInProgress = false

        // Re-run this function if there are more events to process
        if (this.registrationEvents.length > 0) {
          setTimeout(this.tryIssueCertificates.bind(this), 0)
        }
      }
    }
  }

  private async issueCertificates(payload: { csrs: string[]; certificates: string[] }) {
    // Lack of permsData means that we are not the owner of the
    // community in the official model of the app, however anyone can
    // modify the source code, put malicious permsData here, issue
    // false certificates and try to trick other users. To prevent
    // that, peers verify that anything that is written to the
    // certificate store is signed by the owner.
    //
    // NOTE: There may be a race condition here if we try to issue
    // certs before permsData is set. We may want to refactor this or
    // add the ability to retry.
    if (!this.permsData) {
      this.logger('Not issuing certificates due to missing perms data')
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
  }

  public async registerOwnerCertificate(payload: RegisterOwnerCertificatePayload): Promise<void> {
    this.permsData = payload.permsData
    const result = await issueCertificate(payload.userCsr.userCsr, this.permsData)
    if (result?.cert) {
      this.emit(SocketActionTypes.OWNER_CERTIFICATE_ISSUED, {
        communityId: payload.communityId,
        network: { certificate: result.cert },
      })
    } else {
      this.emit(SocketActionTypes.ERROR, {
        type: SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
        code: ErrorCodes.SERVER_ERROR,
        message: ErrorMessages.REGISTRATION_FAILED,
        community: payload.communityId,
      })
    }
  }

  public async registerUserCertificate(csr: string): Promise<void> {
    const result = await issueCertificate(csr, this.permsData)
    this.logger('DuplicatedCertBug', { result })
    if (result?.cert) {
      // Save certificate (awaited) so that we are sure that the certs
      // are saved before processing the next round of CSRs.
      // Otherwise, we could issue a duplicate certificate.

      // @ts-ignore
      await this.storageService?.saveCertificate({ certificate: result.cert })
    }
  }
}
