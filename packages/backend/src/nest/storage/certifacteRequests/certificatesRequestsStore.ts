import { getCrypto } from 'pkijs'
import EventStore from 'orbit-db-eventstore'
import { NoCryptoEngineError } from '@quiet/types'
import { loadCSR, keyFromCertificate } from '@quiet/identity'
import { StorageEvents } from '../storage.types'
import { validate } from 'class-validator'
import { UserCsrData } from '../../registration/registration.functions'
import { Injectable } from '@nestjs/common'
import { OrbitDb } from '../orbitDb/orbitDb.service'
import Logger from '../../common/logger'
import StoreBase from '../base.store'

@Injectable()
export class CertificatesRequestsStore extends StoreBase<string, EventStore<string>> {
  protected readonly logger = Logger(CertificatesRequestsStore.name)
  protected store: EventStore<string> | undefined

  constructor(private readonly orbitDbService: OrbitDb) {
    super()
  }

  public async init() {
    this.logger('Initializing certificates requests store')

    this.store = await this.orbitDbService.orbitDb.log<string>('csrs', {
      replicate: false,
      accessController: {
        write: ['*'],
      },
    })

    this.store.events.on('write', async (_address, entry) => {
      this.logger('Added CSR to database')
      this.loadedCertificateRequests()
    })

    this.store.events.on('replicated', async () => {
      this.logger('Replicated CSRs')
      this.loadedCertificateRequests()
    })

    // TODO: Load CSRs in case the owner closes the app before issuing
    // certificates
    this.logger('Initialized')
  }

  public async loadedCertificateRequests() {
    this.emit(StorageEvents.CSRS_STORED, {
      csrs: await this.getCsrs(),
    })
  }

  public async addEntry(csr: string): Promise<string> {
    this.logger('Adding CSR to database')
    await this.store?.add(csr)
    return csr
  }

  public static async validateUserCsr(csr: string) {
    try {
      const crypto = getCrypto()
      if (!crypto) {
        throw new NoCryptoEngineError()
      }
      const parsedCsr = await loadCSR(csr)
      await parsedCsr.verify()
      await this.validateCsrFormat(csr)
    } catch (err) {
      console.error('Failed to validate user csr:', csr, err?.message)
      return false
    }
    return true
  }

  public static async validateCsrFormat(csr: string) {
    const userData = new UserCsrData()
    userData.csr = csr
    const validationErrors = await validate(userData)
    return validationErrors
  }

  public async getCsrs() {
    const filteredCsrsMap: Map<string, string> = new Map()
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.store.load({ fetchEntryTimeout: 15000 })
    const allEntries = this.getStore()
      .iterator({ limit: -1 })
      .collect()
      .map(e => {
        return e.payload.value
      })

    const allCsrsUnique = [...new Set(allEntries)]
    await Promise.all(
      allCsrsUnique
        .filter(async csr => {
          const validation = await CertificatesRequestsStore.validateUserCsr(csr)
          if (validation) return true
          return false
        })
        .map(async csr => {
          const parsedCsr = await loadCSR(csr)
          const pubKey = keyFromCertificate(parsedCsr)

          if (filteredCsrsMap.has(pubKey)) {
            filteredCsrsMap.delete(pubKey)
          }
          filteredCsrsMap.set(pubKey, csr)
        })
    )
    return [...filteredCsrsMap.values()]
  }

  public clean() {
    // FIXME: Add correct typings on object fields.
    this.store = undefined
  }
}
