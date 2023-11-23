import { getCrypto } from 'pkijs'
import { EventEmitter } from 'events'
import EventStore from 'orbit-db-eventstore'
import OrbitDB from 'orbit-db'

import { NoCryptoEngineError } from '@quiet/types'
import { loadCSR, keyFromCertificate } from '@quiet/identity'

import { StorageEvents } from './storage.types'
import createLogger from '../common/logger'

import { validate } from 'class-validator'
import { UserCsrData } from '../registration/registration.functions'

const logger = createLogger('CertificatesRequestsStore')

interface CsrReplicatedPromiseValues {
  promise: Promise<unknown>
  resolveFunction: any
}

export class CertificatesRequestsStore {
  public orbitDb: OrbitDB
  public store: EventStore<string>
  public csrReplicatedPromiseMap: Map<number, CsrReplicatedPromiseValues> = new Map()
  private csrReplicatedPromiseId: number = 0

  constructor(orbitDb: OrbitDB) {
    this.orbitDb = orbitDb
  }

  public async init(emitter: EventEmitter) {
    logger('Initializing...')
    this.store = await this.orbitDb.log<string>('csrs', {
      replicate: false,
      accessController: {
        write: ['*'],
      },
    })

    this.store.events.on('write', async (_address, entry) => {
      logger('Added CSR to database')
      emitter.emit(StorageEvents.LOADED_USER_CSRS, {
        csrs: await this.getCsrs(),
        id: this.csrReplicatedPromiseId,
      })
    })

    this.store.events.on('replicated', async () => {
      logger('Replicated CSRS')

      this.csrReplicatedPromiseId++
      const filteredCsrs = await this.getCsrs()
      this.createCsrReplicatedPromise(this.csrReplicatedPromiseId)

      // Lock replicated event until previous event is processed by registration service
      if (this.csrReplicatedPromiseId > 1) {
        const csrReplicatedPromiseMapId = this.csrReplicatedPromiseMap.get(this.csrReplicatedPromiseId - 1)

        if (csrReplicatedPromiseMapId?.promise) {
          await csrReplicatedPromiseMapId.promise
        }
      }

      emitter.emit(StorageEvents.LOADED_USER_CSRS, {
        csrs: filteredCsrs,
        id: this.csrReplicatedPromiseId,
      })
    })

    emitter.emit(StorageEvents.LOADED_USER_CSRS, {
      csrs: await this.getCsrs(),
      id: this.csrReplicatedPromiseId,
    })
    logger('Initialized')
  }

  public async close() {
    logger('Closing...')
    await this.store?.close()
    logger('Closed')
  }

  public getAddress() {
    return this.store?.address
  }

  public resetCsrReplicatedMapAndId() {
    this.csrReplicatedPromiseMap = new Map()
    this.csrReplicatedPromiseId = 0
  }

  private createCsrReplicatedPromise(id: number) {
    let resolveFunction
    const promise = new Promise(resolve => {
      resolveFunction = resolve
    })
    this.csrReplicatedPromiseMap.set(id, { promise, resolveFunction })
  }

  public resolveCsrReplicatedPromise(id: number) {
    const csrReplicatedPromiseMapId = this.csrReplicatedPromiseMap.get(id)
    if (csrReplicatedPromiseMapId) {
      csrReplicatedPromiseMapId?.resolveFunction(id)
      this.csrReplicatedPromiseMap.delete(id)
    } else {
      logger.error(`No promise with ID ${id} found.`)
      return
    }
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
      logger.error('Failed to validate user csr:', csr, err?.message)
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
    await this.store.load()
    const allEntries = this.store
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
}
