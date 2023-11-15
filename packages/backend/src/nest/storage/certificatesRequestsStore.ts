import { CertificationRequest, getCrypto } from 'pkijs'
import { EventEmitter } from 'events'
import EventStore from 'orbit-db-eventstore'
import OrbitDB from 'orbit-db'

import { NoCryptoEngineError } from '@quiet/types'
import { loadCSR, keyFromCertificate } from '@quiet/identity'

import { StorageEvents } from './storage.types'
import createLogger from '../common/logger'

import { IsBase64, IsNotEmpty, validate } from 'class-validator'

import { IsCsr, CsrContainsFields } from '../registration/registration.validators'

const logger = createLogger('CertificatesRequestsStore')

interface CsrReplicatedPromiseValues {
  promise: Promise<unknown>
  resolveFunction: any
}

class UserCsrData {
  @IsNotEmpty()
  @IsBase64()
  @IsCsr()
  @CsrContainsFields()
  csr: string
}

export class CertificatesRequestsStore {
  public orbitDb: OrbitDB
  public store: EventStore<string>
  public csrReplicatedPromiseMap: Map<number, CsrReplicatedPromiseValues> = new Map()
  private csrReplicatedPromiseId: number = 0

  constructor(orbitDb: OrbitDB) {
    this.orbitDb = orbitDb
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
      console.log(`No promise with ID ${id} found.`)
      return
    }
  }

  public async init(emitter: EventEmitter) {
    logger('Initializing user csrs log store')

    this.store = await this.orbitDb.log<string>('csrs', {
      replicate: false,
      accessController: {
        write: ['*'],
      },
    })

    this.store.events.on('write', async (_address, entry) => {
      logger('STORE: Saved user csr locally')
      emitter.emit(StorageEvents.LOADED_USER_CSRS, {
        csrs: await this.getCsrs(),
        id: this.csrReplicatedPromiseId,
      })
    })

    this.store.events.on('ready', async () => {
      logger('STORE: Loaded user csrs to memory')
      emitter.emit(StorageEvents.LOADED_USER_CSRS, {
        csrs: await this.getCsrs(),
        id: this.csrReplicatedPromiseId,
      })
    })

    this.store.events.on('replicated', async () => {

      // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
      await this.store.load({ fetchEntryTimeout: 15000 })

      logger('REPLICATED: CSRs')
      this.csrReplicatedPromiseId++
      const filteredCsrs = await this.getCsrs()
      this.createCsrReplicatedPromise(this.csrReplicatedPromiseId)

      if (this.csrReplicatedPromiseId > 1) {
        const csrReplicatedPromiseMapId = this.csrReplicatedPromiseMap.get(this.csrReplicatedPromiseId - 1)

        if (csrReplicatedPromiseMapId?.promise) {
          await csrReplicatedPromiseMapId.promise
        }
      }

      logger('STORE: Replicated user csrs')
      emitter.emit(StorageEvents.LOADED_USER_CSRS, {
        csrs: filteredCsrs,
        id: this.csrReplicatedPromiseId,
      })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.store.load({ fetchEntryTimeout: 15000 })
  }

  public getAddress() {
    return this.store?.address
  }

  public async close() {
    await this.store?.close()
  }

  public async addUserCsr(csr: string) {
    logger('Adding user csr')
    await this.store.add(csr)
    return true
  }

  private async validateUserCsr(csr: string) {
    logger('validating user csr')
    try {
      const crypto = getCrypto()
      if (!crypto) {
        throw new NoCryptoEngineError()
      }
      const parsedCsr = await loadCSR(csr)
      await parsedCsr.verify()
      await this.validateCsr(csr)

      // Validate fields

    } catch (err) {
      logger.error('Failed to validate user csr:', csr, err?.message)
      return false
    }
    return true
  }

  private async validateCsr(csr: string) {
    const userData = new UserCsrData()
    userData.csr = csr
    const validationErrors = await validate(userData)
    return validationErrors
  }

  protected async getCsrs() {
    logger('getCsrs')
    const filteredCsrsMap: Map<string, string> = new Map()

    const allCsrs = this.store
      .iterator({ limit: -1 })
      .collect()
      .map(e => e.payload.value)
    await Promise.all(
      allCsrs.filter(async csr => {
        // const parsedCsr = await loadCSR(csr)
        const validation = await this.validateUserCsr(csr)
        if (validation) return true
        return false
      }).map(async csr => {
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