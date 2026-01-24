import { EncryptedAndSignedPayload } from '../auth/services/crypto/types'

export interface DLQDecryptEntry {
  payload: EncryptedAndSignedPayload
  addedAt: number
}

export interface DLQDecryptGetOptions {
  limit?: number
  scopeType?: string
  scopeGen?: number
}

export interface DLQSerializer {
  serialize(payload: unknown): Buffer
  deserialize(buffer: Buffer): unknown
}

export enum LocalDBKeys {
  // Record of Community objects
  COMMUNITIES = 'communities',
  // ID of current community
  CURRENT_COMMUNITY_ID = 'currentCommunityId',
  // Record of peer details
  PEERS = 'peers',

  IDENTITIES = 'identities',

  // TODO: Deprecate this once we move the Identity data model to the backend
  // (and delete the data from LevelDB).
  COMMUNITY = 'community',
  // TODO: Deprecate this soon (and delete the data from LevelDB). This data
  // exists in the Community object.
  PSK = 'psk',
  // TODO: Deprecate this soon (and delete the data from LevelDB). This data
  // exists in the Community object.
  OWNER_ORBIT_DB_IDENTITY = 'ownerOrbitDbIdentity',

  SIGCHAINS = 'sigchains:',
  USER_CONTEXTS = 'userContexts',
  KEYRINGS = 'keyrings',
  PENDING_HEADS = 'pendingHeads',
  PENDING_QSS_LOG_SYNCS = 'pendingQssLogSyncs',
  LAST_QSS_LOG_SYNC_TIME = 'lastQssLogSyncTime',
  DLQ_DECRYPT = 'dlq:decrypt',
  DLQ_DECRYPT_IDX = 'dlq:idx',
}
export type LocalDbStatus = 'opening' | 'open' | 'closing' | 'closed'
export enum LocalDbEvents {
  COMMUNITY_ADDED = 'COMMUNITY_ADDED',
}
