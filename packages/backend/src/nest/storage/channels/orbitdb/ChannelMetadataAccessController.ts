/**
 * OrbitDB access controller for channel metadata
 */

import {
  AccessController,
  type CanAppendFunc,
  type IdentitiesType,
  type LogEntry,
  type LogType,
  type OrbitDBType,
} from '@orbitdb/core'
import { Injectable } from '@nestjs/common'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { base58btc } from 'multiformats/bases/base58'
import { ComposedStorage, IPFSBlockStorage, LRUStorage, type Storage } from '@orbitdb/core'
import { RoleName } from '../../../auth/services/roles/roles'
import { SigChainService } from '../../../auth/sigchain.service'
import { EncryptedAndSignedPayload } from '../../../auth/services/crypto/types'
import { createLogger } from '../../../common/logger'
import { QuietLogger } from '@quiet/logger'
import { posixJoin } from '../../orbitDb/util'
import type { SigChain } from '../../../auth/sigchain'
import { OrbitDbOp } from '../../orbitDb/orbitdb.types'
import type { PrivateChannelMappings } from '../channels.types'

const TYPE = 'channelmetadataaccess'
const codec = dagCbor
const hasher = sha256
const hashStringEncoding = base58btc

const AccessControlList = async ({
  storage,
  params,
  isPublic,
}: {
  storage: Storage
  params: Record<string, any>
  isPublic: boolean
}) => {
  const manifest = {
    type: `${isPublic ? 'public' : 'private'}${TYPE}`,
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

interface ChannelMetadataAccessControllerConfig {
  write: string[]
  sigchainService: SigChainService
  isPublic: boolean
  getPrivateChannelsByRolename: () => Promise<PrivateChannelMappings>
}

interface ChannelMetadataWriterIdentity {
  id: string
  teamId?: string
}

@Injectable()
export class ChannelMetadataAccessController {
  protected readonly logger: QuietLogger

  constructor(protected sigchainService: SigChainService) {
    this.logger = createLogger(`storage:channels:metadata:orbitdb:access-control:${TYPE}`)
  }

  public createAccessControllerFunc(config: ChannelMetadataAccessControllerConfig): typeof AccessController {
    const accessController = (options?: any) => {
      if (options?.orbitdb != null) {
        return this._createAccessControllerFuncImpl(config)(options)
      }
      return this._createAccessControllerFuncImpl({ ...config, ...options })
    }
    ;(accessController as any).type = TYPE
    return accessController as typeof AccessController
  }

  private _createAccessControllerFuncImpl(config: ChannelMetadataAccessControllerConfig): typeof AccessController {
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
        // FIXME: Figure out typings
        // @ts-ignore
        write = value.write
      } else {
        address = await AccessControlList({ storage, params: { write }, isPublic: config.isPublic })
        address = posixJoin('/', TYPE, address)
      }

      let log: LogType | undefined

      return {
        type: TYPE,
        address,
        write,
        setLogContext: (nextLog: LogType) => {
          log = nextLog
        },
        canAppend: this.canAppend({ ...config, write }, identities, () => log) as any,
      }
    }
  }

  protected canAppend(
    config: ChannelMetadataAccessControllerConfig,
    identities: IdentitiesType,
    getLog: () => LogType | undefined
  ): CanAppendFunc {
    return async (entry: LogEntry<EncryptedAndSignedPayload>): Promise<boolean> => {
      const writerIdentity = (await identities.getIdentity(entry.identity)) as ChannelMetadataWriterIdentity
      if (!writerIdentity) {
        return false
      }

      if (!config.write.includes(writerIdentity.id) && !config.write.includes('*')) {
        return false
      }

      if (!(await identities.verifyIdentity(writerIdentity as any))) {
        return false
      }

      const chain = config.sigchainService.getActiveChain(false)
      if (chain == null) {
        this.logger.warn(`Cannot verify channel metadata writer without an active chain`)
        return false
      }

      if (writerIdentity.teamId != null && writerIdentity.teamId !== chain.team!.id) {
        this.logger.warn(`Channel metadata writer identity is from a different team`, {
          entryTeamId: writerIdentity.teamId,
          activeTeamId: chain.team!.id,
        })
        return false
      }

      if (!chain.roles.memberHasRole(writerIdentity.id, RoleName.MEMBER)) {
        this.logger.warn(`Channel metadata writer is not a team member`, {
          writerId: writerIdentity.id,
        })
        return false
      }

      if (
        entry.payload.op === OrbitDbOp.PUT &&
        !(await this.canAppendPutForKey(entry, getLog(), writerIdentity.id, chain, config))
      ) {
        return false
      }

      let canDelete: boolean
      if (config.isPublic) {
        canDelete = chain.channels.canMemberDeletePublicChannel(writerIdentity.id)
      } else {
        const key = entry.payload.key
        if (key == null) {
          this.logger.warn(`Channel metadata DEL rejected due to missing key`, {
            writerId: writerIdentity.id,
            isPublic: config.isPublic,
          })
          return false
        }
        const channelRoleMappings = await config.getPrivateChannelsByRolename()
        const channelRoleName = channelRoleMappings.idToRoleName[key]
        if (channelRoleName == null) {
          this.logger.warn(
            `Private channel metadata DEL allowed but couldn't validate user's permission because role name couldn't be resolved`,
            {
              writerId: writerIdentity.id,
              channelId: key,
              isPublic: config.isPublic,
            }
          )
          return true
        }
        canDelete = chain.channels.canMemberDeletePrivateChannel(writerIdentity.id, channelRoleName)
      }
      if (entry.payload.op === OrbitDbOp.DEL && !canDelete) {
        this.logger.warn(`Channel metadata DEL rejected due to missing chain permissions`, {
          writerId: writerIdentity.id,
          isPublic: config.isPublic,
        })
        return false
      }

      return true
    }
  }

  private async canAppendPutForKey(
    entry: LogEntry<EncryptedAndSignedPayload>,
    log: LogType | undefined,
    writerId: string,
    chain: SigChain,
    config: ChannelMetadataAccessControllerConfig
  ): Promise<boolean> {
    const channelId = entry.payload.key
    if (channelId == null) {
      this.logger.warn(`Channel metadata PUT rejected because the entry key is missing`, {
        entryHash: entry.hash,
      })
      return false
    }

    if (log == null) {
      this.logger.warn(`Channel metadata PUT rejected because log state is unavailable`, {
        channelId,
        entryHash: entry.hash,
      })
      return false
    }

    const canCreateChannel = config.isPublic
      ? chain.channels.canMemberCreatePublicChannel(writerId)
      : chain.channels.canMemberCreatePrivateChannel(writerId)
    if (!canCreateChannel) {
      this.logger.warn(`Channel metadata PUT rejected due to missing chain permissions`, { entryHash: entry.hash })
      return false
    }

    try {
      for await (const existingEntry of log.traverse(null, async () => false)) {
        if (
          existingEntry.hash !== entry.hash &&
          existingEntry.payload.op === OrbitDbOp.PUT &&
          existingEntry.payload.key === channelId
        ) {
          this.logger.warn(`Channel metadata PUT rejected because the channel id already has a PUT entry`, {
            writerId,
            channelId,
            entryHash: entry.hash,
            existingEntryHash: existingEntry.hash,
          })
          return false
        }
      }
    } catch (e) {
      this.logger.warn(`Channel metadata PUT rejected because log state could not be checked`, {
        channelId,
        entryHash: entry.hash,
        error: e,
      })
      return false
    }

    return true
  }
}
