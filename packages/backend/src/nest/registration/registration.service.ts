import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import { extractPendingCsrs, issueCertificate } from './registration.functions'
import { ErrorCodes, ErrorMessages, PermsData, RegisterOwnerCertificatePayload, SocketActionTypes } from '@quiet/types'
import { RegistrationEvents } from './registration.types'
import { StorageService } from '../storage/storage.service'
import Logger from '../common/logger'

@Injectable()
export class RegistrationService extends EventEmitter implements OnModuleInit {
  private readonly logger = Logger(RegistrationService.name)
  public certificates: string[] = []
  private _permsData: PermsData
  private storageService: StorageService

  constructor() {
    super()
  }

  onModuleInit() {
    this.on(
      RegistrationEvents.REGISTER_USER_CERTIFICATE,
      async (payload: { csrs: string[]; certificates: string[]; id: string }) => {
        await this.registerUserCertificates({ csrs: payload.csrs, id: payload.id })
      }
    )
  }

  public init(storageService: StorageService) {
    this.storageService = storageService
  }

  public set permsData(perms: PermsData) {
    this._permsData = {
      certificate: perms.certificate,
      privKey: perms.privKey,
    }
  }

  public async registerOwnerCertificate(payload: RegisterOwnerCertificatePayload): Promise<string | undefined> {
    if (!this.storageService) {
      throw new Error("Storage Service must be initialized before the Registration Service")
    }

    // FIXME: We should resolve problems with events order and we should set permsData only on LAUNCH_REGISTRART socket event in connectionsManager.
    this._permsData = payload.permsData
    const result = await issueCertificate(payload.userCsr.userCsr, this._permsData)
    if (result?.cert) {
      await this.storageService.certificatesStore.addCertificate(result.cert)
      // Not sure if this is necessary
      const certs = await this.storageService.certificatesStore.loadAllCertificates()
      if (!certs.includes(result.cert)) {
        throw new Error("Cert wasn't added to CertificateStore correctly")
      }
      this.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
        communityId: payload.communityId,
        network: { certificate: result.cert },
      })
      return result?.cert
    } else {
      this.emit(SocketActionTypes.ERROR, {
        type: SocketActionTypes.REGISTRAR,
        code: ErrorCodes.SERVER_ERROR,
        message: ErrorMessages.REGISTRATION_FAILED,
        community: payload.communityId,
      })
    }
  }

  // Apparently, JS will run each function to completion. So assuming
  // we do not have multiple threads, this function should run to
  // completion before it is called again. Because we take the CSRs
  // and then get the latest view of certificates, filter CSRs and
  // then update certificates in a single function, we should never
  // issue a CSR that is contained in the certificates list, at least
  // in this function... as long as there is no other code that
  // updates the certificates list. Something else to consider is that
  // because this function is called asynchronously, there may be
  // several invocations with different CSRs and they may run in an
  // unexpected order. We could address that if it's an issue, but I
  // think that might only affect the order of CSR registration.
  public async registerUserCertificates(payload: { csrs: string[]; id?: string }) {
    if (!this.storageService) {
      throw new Error("Storage Service must be initialized before the Registration Service")
    }

    // Lack of permsData means that we are not the owner of the
    // community in the official model of the app, however anyone can
    // modify the source code, put malicious permsData here, issue
    // false certificates and try to trick other users. To prevent
    // that, peers verify that anything that is written to the
    // certificate store is signed by the owner.
    if (!this._permsData) {
      if (payload.id) this.emit(RegistrationEvents.FINISHED_ISSUING_CERTIFICATES_FOR_ID, { id: payload.id })
      return
    }

    const certificates = await this.storageService.certificatesStore.loadAllCertificates()

    const pendingCsrs = await extractPendingCsrs({ csrs: payload.csrs, certificates: certificates as string[] })

    await Promise.all(
      pendingCsrs.map(async csr => {
        const result = await issueCertificate(csr, this._permsData)
        if (result?.cert) {
          await this.storageService.certificatesStore.addCertificate(result.cert)
          // Not sure if this is necessary
          const certs = await this.storageService.certificatesStore.loadAllCertificates()
          if (!certs.includes(result.cert)) {
            throw new Error("Cert wasn't added to CertificateStore correctly")
          }
          this.emit(RegistrationEvents.NEW_USER, { certificate: result.cert })
        }
      })
    )

    if (payload.id) this.emit(RegistrationEvents.FINISHED_ISSUING_CERTIFICATES_FOR_ID, { id: payload.id })
  }
}
