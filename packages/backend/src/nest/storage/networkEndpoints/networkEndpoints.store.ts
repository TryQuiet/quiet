import { Injectable } from '@nestjs/common'
import { type LogEntry } from '@orbitdb/core'
import { DeviceNetworkEndpoint } from '@quiet/types'
import { validatePeerData } from '@quiet/common'

import { createLogger } from '../../common/logger'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { KeyValueIndexedValidated } from '../orbitDb/keyValueIndexedValidated'
import { type KeyValueIndexedValidatedType } from '../orbitDb/keyValueIndexedValidated'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../../auth/services/crypto/types'
import { SigChainService } from '../../auth/sigchain.service'
import { RoleName } from '../../auth/services/roles/roles'
import { SigchainEvents } from '../../auth/types'
import { OrbitDbOp } from '../orbitDb/orbitdb.types'
import { EncryptedKeyValueIndexedValidatedStoreBase } from '../base.store'
import { NetworkEndpointsAccessController } from './NetworkEndpointsAccessController'
import { StorageEvents } from '../storage.types'

const logger = createLogger('NetworkEndpointsStore')

/**
 * Stores one encrypted, member-visible endpoint per registered device.
 *
 * Device IDs are the key rather than user IDs so that concurrent devices can
 * publish and update their own endpoint without overwriting another device's
 * reachability information.
 */
@Injectable()
export class NetworkEndpointsStore extends EncryptedKeyValueIndexedValidatedStoreBase<
  EncryptedAndSignedPayload,
  DeviceNetworkEndpoint
> {
  private deferredEntries: DeviceNetworkEndpoint[] = []

  constructor(
    private readonly orbitDbService: OrbitDbService,
    private readonly auth: SigChainService,
    private readonly accessController: NetworkEndpointsAccessController
  ) {
    super()
    this.auth.on(SigchainEvents.UPDATED, this.handleAuthUpdated)
  }

  public async init(): Promise<void> {
    logger.info('Initializing network endpoints key/value store')
    this.store = await this.orbitDbService.open<KeyValueIndexedValidatedType<EncryptedAndSignedPayload>>(
      'network-endpoints',
      {
        type: 'KeyValueIndexedValidated',
        sync: false,
        Database: KeyValueIndexedValidated(this.validateEntry.bind(this)),
        AccessController: this.accessController.createAccessControllerFunc({
          write: ['*'],
          sigchainService: this.auth,
        }),
      }
    )

    this.store.events.on('update', () => {
      void this.emitActiveNetworkEndpoints().catch(err =>
        logger.error('Failed to publish replicated network endpoints:', err)
      )
    })

    await this.getStore().retryIndexingUnindexedEntries()
    await this.emitActiveNetworkEndpoints()
  }

  public async startSync(): Promise<void> {
    await this.getStore().sync.start()
    await this.flushDeferredEntries()
  }

  public async flushDeferredEntries(): Promise<void> {
    if (this.deferredEntries.length === 0 || !this.auth.team || !this.auth.roles.amIMember()) {
      return
    }

    const entries = [...this.deferredEntries]
    this.deferredEntries = []
    for (const endpoint of entries) {
      try {
        await this.setEntry(endpoint.deviceId, endpoint)
      } catch (err) {
        logger.error('Failed to flush deferred network endpoint:', endpoint.deviceId, err)
      }
    }
  }

  private readonly handleAuthUpdated = async (): Promise<void> => {
    if (!this.store) {
      return
    }
    try {
      await this.flushDeferredEntries()
      await this.getStore().retryIndexingUnindexedEntries()
      await this.emitActiveNetworkEndpoints()
    } catch (err) {
      logger.error('Failed to update network endpoints:', err)
    }
  }

  public async encryptEntry(payload: DeviceNetworkEndpoint): Promise<EncryptedAndSignedPayload> {
    return this.auth.crypto.encryptAndSign(payload, {
      type: EncryptionScopeType.ROLE,
      name: RoleName.MEMBER,
    })
  }

  public async decryptEntry(payload: EncryptedAndSignedPayload): Promise<DeviceNetworkEndpoint> {
    const decrypted = this.auth.crypto.decryptAndVerify<DeviceNetworkEndpoint>(payload.encrypted, payload.signature)
    if (!decrypted.isValid) {
      throw new Error('Invalid signature on network endpoint entry')
    }
    return decrypted.contents
  }

  public async setEntry(key: string, endpoint: DeviceNetworkEndpoint): Promise<EncryptedAndSignedPayload> {
    if (key !== endpoint.deviceId) {
      throw new Error(`Network endpoint key must match deviceId: ${key} !== ${endpoint.deviceId}`)
    }
    if (!validatePeerData({ peerId: endpoint.peerId, onionAddress: endpoint.onionAddress })) {
      throw new Error(`Invalid network endpoint for device ${endpoint.deviceId}`)
    }

    try {
      const encrypted = await this.encryptEntry(endpoint)
      await this.getStore().put(key, encrypted)
      return encrypted
    } catch (err) {
      this.deferredEntries.push(endpoint)
      logger.error('Failed to set network endpoint:', key, err)
      throw err
    }
  }

  public async getEntry(key: string): Promise<DeviceNetworkEndpoint | null> {
    const encrypted = await this.getStore().get(key)
    return encrypted == null ? null : this.decryptEntry(encrypted)
  }

  public async getNetworkEndpoints(): Promise<DeviceNetworkEndpoint[]> {
    const entries = await this.getStore().all()
    const endpoints = await Promise.all(
      entries.map(async entry => {
        try {
          return await this.decryptEntry(entry.value)
        } catch (err) {
          logger.error('Failed to decrypt network endpoint:', entry.key, err)
          return null
        }
      })
    )
    return endpoints.filter((endpoint): endpoint is DeviceNetworkEndpoint => endpoint != null)
  }

  private async emitActiveNetworkEndpoints(): Promise<void> {
    const team = this.auth.getActiveChain(false)?.team
    const endpoints = team
      ? (await this.getNetworkEndpoints()).filter(
          endpoint => endpoint.teamId === team.id && team.hasDevice(endpoint.deviceId)
        )
      : []
    this.emit(StorageEvents.NETWORK_ENDPOINTS_STORED, { endpoints })
  }

  /**
   * The access controller authenticates writers and authorizes endpoint
   * ownership.  This validator protects the indexed projection as well,
   * including entries received before their writer's identity is available.
   */
  public async validateEntry(entry: LogEntry<EncryptedAndSignedPayload>): Promise<boolean> {
    if (entry.payload.op !== OrbitDbOp.PUT) {
      // DEL is intentionally unsupported: endpoint removal follows sigchain
      // device membership and must not erase replicated reachability records.
      return false
    }

    try {
      const encrypted = entry.payload.value
      if (encrypted == null || entry.payload.key == null) {
        return false
      }
      const endpoint = await this.decryptEntry(encrypted)
      return (
        encrypted.encrypted.scope.type === EncryptionScopeType.ROLE &&
        encrypted.encrypted.scope.name === RoleName.MEMBER &&
        encrypted.userId === endpoint.userId &&
        encrypted.teamId === endpoint.teamId &&
        encrypted.signature.author.name === endpoint.userId &&
        entry.payload.key === endpoint.deviceId &&
        validatePeerData({ peerId: endpoint.peerId, onionAddress: endpoint.onionAddress })
      )
    } catch (err) {
      logger.error('Failed to validate network endpoint entry:', entry.hash, err)
      return false
    }
  }

  public async clean(): Promise<void> {
    logger.info('Cleaning network endpoints store')
    this.deferredEntries = []
    const store = this.store
    try {
      await store?.sync?.stop?.()
    } catch (err) {
      // Sync may not have started.
    }
    try {
      await store?.drop?.()
    } catch (err) {
      logger.error('Failed to drop network endpoints store:', err)
    }
    try {
      await store?.close?.()
    } catch (err) {
      logger.error('Failed to close network endpoints store after drop:', err)
    }
    this.store = undefined
  }
}
