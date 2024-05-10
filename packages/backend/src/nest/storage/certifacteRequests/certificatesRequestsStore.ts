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
import { createLogger } from '../../common/logger'

@Injectable()
export class CertificatesRequestsStore extends EventEmitter {
  public store: EventStore<string>

  private readonly logger = createLogger(CertificatesRequestsStore.name)

  constructor(private readonly orbitDbService: OrbitDb) {
    super()
  }

  public async init() {
    this.logger.info('Initializing certificates requests store')

    this.store = await this.orbitDbService.orbitDb.log<string>('csrs', {
      replicate: false,
      accessController: {
        write: ['*'],
      },
    })
    await this.store.load()

    this.store.events.on('write', async (_address, entry) => {
      this.logger.info('Added CSR to database')
      this.loadedCertificateRequests()
    })

    this.store.events.on('replicated', async () => {
      this.logger.info('Replicated CSRs')
      this.loadedCertificateRequests()
    })

    this.logger.info('Initialized')
  }

  public async loadedCertificateRequests() {
    this.emit(StorageEvents.CSRS_STORED, {
      csrs: await this.getCsrs(),
    })
  }

  public async close() {
    this.logger.info('Closing certificate requests DB')
    await this.store?.close()
    this.logger.info('Closed certificate requests DB')
  }

  public getAddress() {
    return this.store?.address
  }

  public async addUserCsr(csr: string) {
    await this.store.add(csr)
    return true
  }

  public async validateUserCsr(csr: string) {
    try {
      const crypto = getCrypto()
      if (!crypto) {
        throw new NoCryptoEngineError()
      }
      const parsedCsr = await loadCSR(csr)
      await parsedCsr.verify()
      await this.validateCsrFormat(csr)
    } catch (err) {
      this.logger.error('Failed to validate user CSR:', csr, err?.message)
      return false
    }
    return true
  }

  public async validateCsrFormat(csr: string) {
    const userData = new UserCsrData()
    userData.csr = csr
    const validationErrors = await validate(userData)
    return validationErrors
  }

  public async getCsrs() {
    const filteredCsrsMap: Map<string, string> = new Map()
    const allEntries = this.store
      .iterator({ limit: -1 })
      .collect()
      .map(e => {
        return e.payload.value
      })
    this.logger.info('Total CSRs:', allEntries.length)

    const allCsrsUnique = [...new Set(allEntries)]
    await Promise.all(
      allCsrsUnique
        .filter(async csr => {
          const validation = await this.validateUserCsr(csr)
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
    const validCsrs = [...filteredCsrsMap.values()]
    this.logger.info('Valid CSRs:', validCsrs.length)
    return validCsrs
  }

  public clean() {
    // FIXME: Add correct typings on object fields.

    // @ts-ignore
    this.store = undefined
  }
}
