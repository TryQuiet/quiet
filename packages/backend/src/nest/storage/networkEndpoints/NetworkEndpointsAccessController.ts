/**
 * OrbitDB access controller for per-device network endpoints.
 *
 * The encrypted payload is member-visible, while the outer OrbitDB entry is
 * authenticated by the device signing key.  Keeping the two checks separate
 * is intentional: the user signature proves which user encrypted the value;
 * the OrbitDB entry signature proves which device wrote the key/value entry.
 */
import {
  AccessController,
  type CanAppendFunc,
  type IdentitiesType,
  type LogEntry,
  type OrbitDBType,
} from '@orbitdb/core'
import { DeviceNetworkEndpoint } from '@quiet/types'
import { validatePeerData } from '@quiet/common'
import { Injectable } from '@nestjs/common'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { base58btc } from 'multiformats/bases/base58'
import { ComposedStorage, IPFSBlockStorage, LRUStorage, type Storage } from '@orbitdb/core'
import { QuietLogger } from '@quiet/logger'

import { RoleName } from '../../auth/services/roles/roles'
import { SigChainService } from '../../auth/sigchain.service'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../../auth/services/crypto/types'
import { createLogger } from '../../common/logger'
import { getVerifiedEntryWriter } from '../orbitDb/identity/lfa/entry-writer'
import { posixJoin } from '../orbitDb/util'
import { OrbitDbOp } from '../orbitDb/orbitdb.types'

const TYPE = 'networkendpointsaccess'
const codec = dagCbor
const hasher = sha256
const hashStringEncoding = base58btc

export interface NetworkEndpointsAccessControllerConfig {
  write: string[]
  sigchainService: SigChainService
}

const AccessControlList = async ({ storage, params }: { storage: Storage; params: Record<string, any> }) => {
  const manifest = {
    type: TYPE,
    ...params,
  }
  const { cid, bytes } = await Block.encode({ value: manifest, codec, hasher })
  const hash = cid.toString(hashStringEncoding)
  await storage.put(hash, bytes)
  return hash
}

const getAccessControllerManifestHash = (address: string): string => {
  const hash = address.split('/').filter(Boolean).pop()
  if (hash == null) {
    throw new Error(`Invalid access controller address: ${address}`)
  }
  return hash
}

@Injectable()
export class NetworkEndpointsAccessController {
  protected readonly logger: QuietLogger

  constructor(protected readonly sigchainService: SigChainService) {
    this.logger = createLogger(`storage:network-endpoints:orbitdb:access-control:${TYPE}`)
  }

  public createAccessControllerFunc(config: NetworkEndpointsAccessControllerConfig): typeof AccessController {
    const accessController = (options?: any) => {
      if (options?.orbitdb != null) {
        return this._createAccessControllerFuncImpl(config)(options)
      }
      return this._createAccessControllerFuncImpl({ ...config, ...options })
    }
    ;(accessController as any).type = TYPE
    return accessController as typeof AccessController
  }

  private _createAccessControllerFuncImpl(config: NetworkEndpointsAccessControllerConfig): typeof AccessController {
    return async ({
      orbitdb,
      identities,
      address,
    }: {
      orbitdb: OrbitDBType
      identities: IdentitiesType
      address?: string
      name?: string
    }) => {
      const storage = await ComposedStorage(
        await LRUStorage({ size: 1000 }),
        await IPFSBlockStorage({ ipfs: orbitdb.ipfs, pin: true })
      )
      let write = config.write || [orbitdb.identity.id]

      if (address) {
        const manifestBytes = await storage.get(getAccessControllerManifestHash(address))
        const { value } = await Block.decode({ bytes: manifestBytes, codec, hasher })
        // FIXME: OrbitDB's manifest type does not expose the decoded shape.
        // @ts-ignore
        write = value.write
      } else {
        address = await AccessControlList({ storage, params: { write } })
        address = posixJoin('/', TYPE, address)
      }

      return {
        type: TYPE,
        address,
        write,
        canAppend: this.canAppend({ ...config, write }, identities) as any,
      }
    }
  }

  protected canAppend(config: NetworkEndpointsAccessControllerConfig, identities: IdentitiesType): CanAppendFunc {
    return async (entry: LogEntry<EncryptedAndSignedPayload>): Promise<boolean> => {
      const writerIdentity = await getVerifiedEntryWriter(identities, entry)
      if (writerIdentity == null) {
        return false
      }

      if (!config.write.includes(writerIdentity.id) && !config.write.includes('*')) {
        return false
      }

      const chain = config.sigchainService.getActiveChain(false)
      const team = chain?.team
      const activeTeamId = team?.id
      if (chain == null || team == null || activeTeamId == null) {
        this.logger.warn('Cannot verify network endpoint writer without an active team')
        return false
      }

      // A writer must be an active registered device, and the device's
      // registered owner must be the identity authenticated by the entry.
      if (writerIdentity.teamId !== activeTeamId || !team.hasDevice(writerIdentity.deviceId)) {
        this.logger.warn('Network endpoint writer is not an active team device', {
          writerId: writerIdentity.id,
          deviceId: writerIdentity.deviceId,
          writerTeamId: writerIdentity.teamId,
          activeTeamId,
        })
        return false
      }

      let registeredOwner: string
      try {
        registeredOwner = team.memberByDeviceId(writerIdentity.deviceId).userId
      } catch (err) {
        this.logger.warn('Network endpoint writer device has no active registered owner', {
          writerId: writerIdentity.id,
          deviceId: writerIdentity.deviceId,
          error: err,
        })
        return false
      }
      if (registeredOwner !== writerIdentity.id) {
        this.logger.warn('Network endpoint writer does not own its registered device', {
          writerId: writerIdentity.id,
          deviceId: writerIdentity.deviceId,
          registeredOwner,
        })
        return false
      }

      // Endpoint deletion is intentionally unsupported.  Offline devices must
      // retain their records, and device removal is represented by the team
      // sigchain rather than destructive endpoint-store operations.
      if (entry.payload.op === OrbitDbOp.DEL) {
        this.logger.warn('Network endpoint DELETE rejected', { entryHash: entry.hash })
        return false
      }
      if (entry.payload.op !== OrbitDbOp.PUT) {
        return false
      }

      const encPayload = entry.payload.value
      if (encPayload == null || entry.payload.key == null) {
        return false
      }
      if (
        encPayload.userId !== writerIdentity.id ||
        encPayload.teamId !== activeTeamId ||
        encPayload.signature?.author?.name !== writerIdentity.id ||
        encPayload.encrypted?.scope?.type !== EncryptionScopeType.ROLE ||
        encPayload.encrypted?.scope?.name !== RoleName.MEMBER
      ) {
        this.logger.warn('Network endpoint encrypted payload identity, team, or scope did not match', {
          entryHash: entry.hash,
          key: entry.payload.key,
          writerId: writerIdentity.id,
        })
        return false
      }

      let endpoint: DeviceNetworkEndpoint
      try {
        const decrypted = chain.crypto.decryptAndVerify<DeviceNetworkEndpoint>(
          encPayload.encrypted,
          encPayload.signature
        )
        if (!decrypted.isValid) {
          return false
        }
        endpoint = decrypted.contents
      } catch (err) {
        this.logger.warn('Network endpoint payload could not be decrypted or verified', {
          entryHash: entry.hash,
          error: err,
        })
        return false
      }

      if (
        endpoint.teamId !== activeTeamId ||
        endpoint.userId !== writerIdentity.id ||
        endpoint.deviceId !== writerIdentity.deviceId ||
        entry.payload.key !== endpoint.deviceId ||
        !validatePeerData({ peerId: endpoint.peerId, onionAddress: endpoint.onionAddress })
      ) {
        this.logger.warn('Network endpoint key, owner, team, or address did not match', {
          entryHash: entry.hash,
          key: entry.payload.key,
          endpointDeviceId: endpoint.deviceId,
          writerDeviceId: writerIdentity.deviceId,
          endpointUserId: endpoint.userId,
          writerId: writerIdentity.id,
        })
        return false
      }

      return true
    }
  }
}
