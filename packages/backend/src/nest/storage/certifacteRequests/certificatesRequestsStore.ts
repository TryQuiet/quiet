import { getCrypto } from 'pkijs'
import { EventEmitter } from 'events'
import EventStore from 'orbit-db-eventstore'
import { NoCryptoEngineError } from '@quiet/types'
import { loadCSR, keyFromCertificate } from '@quiet/identity'
import { CsrReplicatedPromiseValues, StorageEvents } from '../storage.types'
import { validate } from 'class-validator'
import { UserCsrData } from '../../registration/registration.functions'
import { Injectable } from '@nestjs/common'
import { OrbitDb } from '../orbitDb/orbitDb.service'
import Logger from '../../common/logger'

@Injectable()
export class CertificatesRequestsStore {
  public store: EventStore<string>
  private emitter: EventEmitter

  private readonly logger = Logger(CertificatesRequestsStore.name)

  constructor(private readonly orbitDbService: OrbitDb) {}

  public async init(emitter: EventEmitter) {
    this.logger('Initializing...')
    this.emitter = emitter
    this.store = await this.orbitDbService.orbitDb.log<string>('csrs', {
      replicate: false,
      accessController: {
        write: ['*'],
      },
    })

    this.store.events.on('write', async (_address, entry) => {
      this.logger('Added CSR to database')
      await this.loadCsrs()
    })

    this.store.events.on('replicated', async () => {
      await this.loadCsrs()
    })

    await this.loadCsrs()
    this.logger('Initialized')
  }

  public async loadCsrs() {
    this.emitter.emit(StorageEvents.LOADED_USER_CSRS, {
      csrs: await this.getCsrs(),
    })
  }

  public async close() {
    this.logger('Closing...')
    await this.store?.close()
    this.logger('Closed')
  }

  public getAddress() {
    return this.store?.address
  }

  // TODO: Remove and fix tests
  public resolveCsrReplicatedPromise(id: number) {
  }

  public async addUserCsr(csr: string) {
    await this.store.add(csr)
    return true
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
    const allEntries = this.store
      .iterator({ limit: -1 })
      .collect()
      .map(e => {
        return e.payload.value
      })

    this.logger('DuplicatedCertBug', { allEntries })
    const allCsrsUnique = [...new Set(allEntries)]
    this.logger('DuplicatedCertBug', { allCsrsUnique })
    await Promise.all(
      allCsrsUnique
        .filter(async csr => {
          const validation = await CertificatesRequestsStore.validateUserCsr(csr)
          this.logger('DuplicatedCertBug', { validation, csr })
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
    this.logger('DuplicatedCertBug', '[...filteredCsrsMap.values()]', [...filteredCsrsMap.values()])
    return [...filteredCsrsMap.values()]
  }
}
