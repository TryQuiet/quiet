/**
 * OrbitDB access controller for user profiles
 */

import {
  AccessController,
  type CanAppendFunc,
  type IdentitiesType,
  type LogEntry,
  type OrbitDBType,
} from '@orbitdb/core'
import { Injectable } from '@nestjs/common'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { base58btc } from 'multiformats/bases/base58'
import { ComposedStorage, IPFSBlockStorage, LRUStorage, type Storage } from '@orbitdb/core'
import { UserProfile } from '@quiet/types'
import { QuietLogger } from '@quiet/logger'

import { RoleName } from '../../auth/services/roles/roles'
import { SigChainService } from '../../auth/sigchain.service'
import { EncryptedAndSignedPayload } from '../../auth/services/crypto/types'
import { createLogger } from '../../common/logger'
import { posixJoin } from '../orbitDb/util'
import { validateUserProfile } from './userProfile.utils'
import type { SigChain } from '../../auth/sigchain'
import type { UserProfileAccessControllerConfig, UserProfileWriterIdentity } from './UserProfileAccessController.types'

const TYPE = 'userprofileaccess'
const codec = dagCbor
const hasher = sha256
const hashStringEncoding = base58btc

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
export class UserProfileAccessController {
  protected readonly logger: QuietLogger

  constructor(protected sigchainService: SigChainService) {
    this.logger = createLogger(`storage:user-profile:orbitdb:access-control:${TYPE}`)
  }

  public createAccessControllerFunc(config: UserProfileAccessControllerConfig): typeof AccessController {
    const accessController = (options?: any) => {
      if (options?.orbitdb != null) {
        return this._createAccessControllerFuncImpl(config)(options)
      }
      return this._createAccessControllerFuncImpl({ ...config, ...options })
    }
    ;(accessController as any).type = TYPE
    return accessController as typeof AccessController
  }

  private _createAccessControllerFuncImpl(config: UserProfileAccessControllerConfig): typeof AccessController {
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

  protected canAppend(config: UserProfileAccessControllerConfig, identities: IdentitiesType): CanAppendFunc {
    return async (entry: LogEntry<EncryptedAndSignedPayload>): Promise<boolean> => {
      const writerIdentity = (await identities.getIdentity(entry.identity)) as UserProfileWriterIdentity
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
        this.logger.warn(`Cannot verify user profile writer without an active chain`)
        return false
      }

      const activeTeamId = chain.team?.id
      if (activeTeamId == null) {
        this.logger.warn(`Cannot verify user profile writer without an active team`)
        return false
      }

      if (writerIdentity.teamId != null && writerIdentity.teamId !== activeTeamId) {
        this.logger.warn(`User profile writer identity is from a different team`, {
          entryTeamId: writerIdentity.teamId,
          activeTeamId,
        })
        return false
      }

      if (entry.payload.op === 'PUT' && !(await this.canAppendPutEntry(entry, chain, writerIdentity.id))) {
        return false
      }

      if (chain.roles.memberIsAdmin(writerIdentity.id)) {
        return true
      }

      if (!chain.roles.memberHasRole(writerIdentity.id, RoleName.MEMBER)) {
        this.logger.warn(`User profile writer is not a team member`, {
          writerId: writerIdentity.id,
        })
        return false
      }

      return true
    }
  }

  private async canAppendPutEntry(
    entry: LogEntry<EncryptedAndSignedPayload>,
    chain: SigChain,
    writerId: string
  ): Promise<boolean> {
    const key = entry.payload.key
    const encPayload = entry.payload.value
    if (key == null) {
      this.logger.warn(`User profile PUT rejected because the entry key is missing`, {
        entryHash: entry.hash,
      })
      return false
    }

    if (encPayload == null) {
      this.logger.warn(`User profile PUT rejected because the payload value is missing`, {
        key,
        entryHash: entry.hash,
      })
      return false
    }

    const valueUserId = encPayload.userId
    const sigAuthor = encPayload.signature?.author?.name
    if (valueUserId == null || sigAuthor == null || key !== valueUserId || key !== sigAuthor) {
      this.logger.warn(`User profile PUT rejected because entry ids do not match`, {
        key,
        valueUserId,
        sigAuthor,
        entryHash: entry.hash,
      })
      return false
    }

    if (writerId !== sigAuthor) {
      this.logger.warn(`User profile PUT rejected because writer does not match encrypted signature author`, {
        writerId,
        sigAuthor,
        entryHash: entry.hash,
      })
      return false
    }

    if (encPayload.teamId !== chain.team?.id) {
      this.logger.warn(`User profile PUT rejected because payload team does not match active chain`, {
        payloadTeamId: encPayload.teamId,
        activeTeamId: chain.team?.id,
        entryHash: entry.hash,
      })
      return false
    }

    let profile: UserProfile
    try {
      const decrypted = chain.crypto.decryptAndVerify<UserProfile>(encPayload.encrypted, encPayload.signature)
      if (!decrypted.isValid) {
        this.logger.warn(`User profile PUT rejected because the encrypted payload signature is invalid`, {
          key,
          entryHash: entry.hash,
        })
        return false
      }
      profile = decrypted.contents
    } catch (err) {
      this.logger.warn(`User profile PUT rejected because the payload could not be decrypted`, {
        key,
        entryHash: entry.hash,
        error: err,
      })
      return false
    }

    if (profile?.userId == null || profile.userId !== key) {
      this.logger.warn(`User profile PUT rejected because decrypted user id does not match the entry key`, {
        key,
        decryptedUserId: profile?.userId,
        entryHash: entry.hash,
      })
      return false
    }

    const validation = await validateUserProfile(profile)
    if (!validation.success) {
      this.logger.warn(`User profile PUT rejected because the decrypted profile is invalid`, {
        key,
        entryHash: entry.hash,
        error: validation.error,
      })
      return false
    }

    return true
  }
}
