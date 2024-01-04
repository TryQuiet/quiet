import { getCrypto } from 'pkijs'
import { EventEmitter } from 'events'
import { StorageEvents } from '../storage.types'
import EventStore from 'orbit-db-eventstore'
import { CommunityMetadata, NoCryptoEngineError } from '@quiet/types'
import {
  keyFromCertificate,
  CertFieldsTypes,
  parseCertificate,
  getCertFieldValue,
  loadCertificate,
} from '@quiet/identity'
import { ConnectionProcessInfo, SocketActionTypes, UserData } from '@quiet/types'
import { validate } from 'class-validator'
import { CertificateData } from '../../registration/registration.functions'
import { OrbitDb } from '../orbitDb/orbitDb.service'
import { Injectable } from '@nestjs/common'
import Logger from '../../common/logger'

@Injectable()
export class CertificatesStore {
  public store: EventStore<string>
  private metadata: CommunityMetadata | undefined
  private filteredCertificatesMapping: Map<string, Partial<UserData>>
  private usernameMapping: Map<string, string>

  private readonly logger = Logger(CertificatesStore.name)

  constructor(private readonly orbitDbService: OrbitDb) {
    this.filteredCertificatesMapping = new Map()
    this.usernameMapping = new Map()
  }

  public resetValues() {
    this.metadata = undefined
    this.filteredCertificatesMapping = new Map()
    this.usernameMapping = new Map()
  }

  public async init(emitter: EventEmitter) {
    this.logger('Initializing certificates log store')

    this.store = await this.orbitDbService.orbitDb.log<string>('certificates', {
      replicate: false,
      accessController: {
        write: ['*'],
      },
    })

    this.store.events.on('ready', async () => {
      this.logger('Loaded certificates to memory')
      emitter.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CERTIFICATES_REPLICATED)
    })

    this.store.events.on('write', async () => {
      this.logger('Saved certificate locally')
      await loadedCertificates()
    })

    this.store.events.on('replicated', async () => {
      this.logger('REPLICATED: Certificates')
      emitter.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CERTIFICATES_REPLICATED)
      await loadedCertificates()
    })

    const loadedCertificates = async () => {
      emitter.emit(StorageEvents.LOADED_CERTIFICATES, {
        certificates: await this.getCertificates(),
      })
    }

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.store.load({ fetchEntryTimeout: 15000 })

    this.logger('Initialized')
  }

  public async close() {
    await this.store?.close()
  }

  public getAddress() {
    return this.store?.address
  }

  public async addCertificate(certificate: string) {
    this.logger('Adding user certificate')
    await this.store.add(certificate)
    return true
  }

  public async loadAllCertificates() {
    const certificates = await this.getCertificates()
    return certificates
  }

  public updateMetadata(metadata: CommunityMetadata) {
    if (!metadata) return
    this.metadata = metadata
  }

  private async validateCertificate(certificate: string) {
    try {
      await this.validateCertificateAuthority(certificate)
      await this.validateCertificateFormat(certificate)
    } catch (err) {
      this.logger.error('Failed to validate user certificate:', certificate, err?.message)
      return false
    }
    return true
  }

  private async validateCertificateAuthority(certificate: string) {
    const crypto = getCrypto()

    if (!crypto) {
      throw new NoCryptoEngineError()
    }

    const parsedCertificate = loadCertificate(certificate)

    let metadata = this.metadata
    while (!metadata) {
      await new Promise<void>(res => setTimeout(res, 100))
      metadata = this.metadata
    }

    const parsedRootCertificate = loadCertificate(metadata.rootCa)
    const verification = await parsedCertificate.verify(parsedRootCertificate)

    return verification
  }

  private async validateCertificateFormat(certificate: string) {
    const certificateData = new CertificateData()
    certificateData.certificate = certificate
    const validationErrors = await validate(certificateData)
    return validationErrors
  }

  /*
   * Method returning store entries, filtered by validation result
   * as specified in the comment section of
   * https://github.com/TryQuiet/quiet/issues/1899
   */
  protected async getCertificates() {
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.store.load({ fetchEntryTimeout: 15000 })
    const allCertificates = this.store
      .iterator({ limit: -1 })
      .collect()
      .map(e => e.payload.value)

    this.logger(`All certificates: ${allCertificates.length}`)
    const validCertificates = await Promise.all(
      allCertificates.map(async certificate => {
        if (this.filteredCertificatesMapping.has(certificate)) {
          return certificate // Only validate certificates
        }

        const validation = await this.validateCertificate(certificate)
        this.logger('DuplicatedCertBug', { validation, certificate })
        if (validation) {
          const parsedCertificate = parseCertificate(certificate)
          const pubkey = keyFromCertificate(parsedCertificate)

          const username = getCertFieldValue(parsedCertificate, CertFieldsTypes.nickName)

          // @ts-expect-error
          this.usernameMapping.set(pubkey, username)

          const data: Partial<UserData> = {
            // @ts-expect-error
            username: username,
          }

          this.filteredCertificatesMapping.set(certificate, data)

          return certificate
        }
      })
    )

    const validCerts = validCertificates.filter(i => i != undefined)
    this.logger(`Valid certificates: ${validCerts.length}`)
    return validCerts
  }

  public async getCertificateUsername(pubkey: string) {
    const cache = this.usernameMapping.get(pubkey)
    if (cache) return cache

    // Perform cryptographic operations and populate cache
    await this.getCertificates()

    // Return desired data from updated cache
    return this.usernameMapping.get(pubkey)
  }
}
