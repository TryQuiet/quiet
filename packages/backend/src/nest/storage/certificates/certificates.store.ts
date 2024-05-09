import { getCrypto } from 'pkijs'
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
import { EventStoreBase } from '../base.store'

@Injectable()
export class CertificatesStore extends EventStoreBase<string> {
  protected readonly logger = Logger(CertificatesStore.name)

  private metadata: CommunityMetadata | undefined
  private filteredCertificatesMapping: Map<string, Partial<UserData>>
  private usernameMapping: Map<string, string>

  constructor(private readonly orbitDbService: OrbitDb) {
    super()
    this.filteredCertificatesMapping = new Map()
    this.usernameMapping = new Map()
  }

  public async init() {
    this.logger('Initializing certificates log store')

    this.store = await this.orbitDbService.orbitDb.log<string>('certificates', {
      replicate: false,
      accessController: {
        write: ['*'],
      },
    })

    this.store.events.on('ready', async () => {
      this.logger('Loaded certificates to memory')
      this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CERTIFICATES_STORED)
    })

    this.store.events.on('write', async () => {
      this.logger('Saved certificate locally')
      await this.loadedCertificates()
    })

    this.store.events.on('replicated', async () => {
      this.logger('REPLICATED: Certificates')
      this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CERTIFICATES_STORED)
      await this.loadedCertificates()
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.store.load({ fetchEntryTimeout: 15000 })

    this.logger('Initialized')
  }

  public async loadedCertificates() {
    this.emit(StorageEvents.CERTIFICATES_STORED, {
      certificates: await this.getEntries(),
    })
  }

  public async addEntry(certificate: string): Promise<string> {
    this.logger('Adding user certificate')
    await this.store?.add(certificate)
    return certificate
  }

  public updateMetadata(metadata: CommunityMetadata) {
    if (!metadata) return
    this.metadata = metadata
    // FIXME: Community metadata is required for validating
    // certificates, so we re-validate certificates once community
    // metadata is set. Currently the certificates store receives the
    // community metadata via an event. Is there a better way to
    // organize this so that the dependencies are clearer? Having
    // CertificateStore depend on CommunityMetadataStore directly?
    // Storing community metadata in LevelDB? Only initializing
    // certificate store after community metadata is available?
    if (this.store) {
      this.loadedCertificates()
    }
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

    if (!this.metadata) {
      throw new Error('Community metadata missing')
    }

    const parsedRootCertificate = loadCertificate(this.metadata.rootCa)
    const parsedCertificate = loadCertificate(certificate)
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
  public async getEntries(): Promise<string[]> {
    if (!this.store) {
      return []
    }

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
    // TODO: Why doesn't TS infer this properly?
    return validCerts as string[]
  }

  public async getCertificateUsername(pubkey: string) {
    const cache = this.usernameMapping.get(pubkey)
    if (cache) return cache

    // Perform cryptographic operations and populate cache
    await this.getEntries()

    // Return desired data from updated cache
    return this.usernameMapping.get(pubkey)
  }

  public clean() {
    this.logger('Cleaning certificates store')
    this.store = undefined
    this.metadata = undefined
    this.filteredCertificatesMapping = new Map()
    this.usernameMapping = new Map()
  }
}
