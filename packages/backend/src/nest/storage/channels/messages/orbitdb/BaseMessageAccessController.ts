/**
 * Base OrbitDB access controller
 */

import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { base58btc } from 'multiformats/bases/base58'
import {
  type Storage,
  type OrbitDBType,
  type LogEntry,
  type IdentitiesType,
  ComposedStorage,
  LRUStorage,
  IPFSBlockStorage,
  AccessControllerType,
  AccessController,
  CanAppendFunc,
} from '@orbitdb/core'
import { getCrypto } from 'pkijs'
import { NoCryptoEngineError, NotImplementedError } from '@quiet/types'
import { posixJoin } from '../../../orbitDb/util'
import { EncryptedMessage } from '../messages.types'
import { createLogger } from '../../../../common/logger'
import { QuietLogger } from '@quiet/logger'
import { SigChainService } from 'packages/backend/src/nest/auth/sigchain.service'

const codec = dagCbor
const hasher = sha256
const hashStringEncoding = base58btc

const AccessControlList = async ({
  storage,
  type,
  params,
}: {
  storage: Storage
  type: string
  params: Record<string, any>
}) => {
  const manifest = {
    type,
    ...params,
  }
  const { cid, bytes } = await Block.encode({ value: manifest, codec, hasher })
  const hash = cid.toString(hashStringEncoding)
  await storage.put(hash, bytes)
  return hash
}

export interface AccessControllerConfig {
  write: string[]
  sigchainService: SigChainService
  roleName?: string
}

export class BaseMessagesAccessController {
  protected readonly logger: QuietLogger
  constructor(
    protected readonly type: string,
    protected readonly sigchainService: SigChainService
  ) {
    this.logger = createLogger(`storage:channels:messages:orbitdb:access-control:${this.type}`)
  }

  public createAccessControllerFunc(config: AccessControllerConfig): typeof AccessController {
    const accessController = this._createAccessControllerFuncImpl(config)
    ;(accessController as any).type = this.type
    return accessController
  }

  private _createAccessControllerFuncImpl(config: AccessControllerConfig): typeof AccessController {
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
        const manifestBytes = await storage.get(address.replaceAll('/ipfs/', ''))
        const { value } = await Block.decode({ bytes: manifestBytes, codec, hasher })
        // FIXME: Figure out typings
        // @ts-ignore
        write = value.write
      } else {
        address = await AccessControlList({ storage, type: this.type, params: { write } })
        address = posixJoin('/', this.type, address)
      }

      const crypto = getCrypto()

      return {
        type: this.type,
        address,
        write,
        canAppend: this.canAppend(config, identities) as any,
      }
    }
  }

  protected canAppend(config: AccessControllerConfig, identities: IdentitiesType): CanAppendFunc {
    throw new NotImplementedError('canAppend')
  }
}
