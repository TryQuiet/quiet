import { Keyset } from '3rd-party/auth/packages/auth/dist'
import { CompoundError } from '@quiet/types'
import { EncryptedAndSignedPayload } from '../auth/services/crypto/types'

/**
 * Quiet-specific websocket event types
 */
export enum WebsocketEvents {
  CREATE_COMMUNITY = 'create-community',
  GET_COMMUNITY = 'get-community',
  AUTH_SYNC = 'auth-sync',
  GEN_PUB_KEYS = 'generate-public-keys',
  SIGN_IN_COMMUNITY = 'sign-in-community',
  DATA_SYNC = 'data-sync',
}

/**
 * Event emitter events
 */
export enum QSSEvents {
  QSS_AUTH_JOINED = 'qssAuthJoined',
}

export interface BaseWebsocketMessage<T extends object | undefined> {
  ts: number
  status: string
  reason?: string
  payload?: T
}

export interface QSSCommunity {
  teamId: string
  sigChain: string
}

export interface CreateCommunityPayload {
  community: QSSCommunity
  teamKeyring: string
  userId: string
}

export interface CreateCommunity {
  ts: number
  payload: CreateCommunityPayload
}

export enum CreateCommunityStatus {
  ERROR = 'error',
  SUCCESS = 'success',
}
export interface CreateCommunityResponse extends BaseWebsocketMessage<undefined> {
  ts: number
  status: CreateCommunityStatus
  reason?: string
}

export class QSSConnectionError<T extends Error> extends CompoundError<T> {}
export class QSSNotInitializedError<T extends Error> extends CompoundError<T> {}
export class QSSHandshakeError<T extends Error> extends CompoundError<T> {
  constructor(reason: string, original?: T) {
    super(QSSHandshakeError._formatMessage(reason), original)
  }

  private static _formatMessage(reason: string): string {
    return `Error during handshake: ${reason}`
  }
}

export enum CommunityOperationStatus {
  ERROR = 'error',
  SUCCESS = 'success',
  SENDING = 'sending',
  UNAUTHORIZED = 'unauthorized',
  NOT_FOUND = 'not found',
}

export interface AuthSyncMessagePayload {
  userId: string
  teamId: string
  message: string
}

export interface AuthSyncMessage extends BaseWebsocketMessage<AuthSyncMessagePayload> {
  ts: number
  status: CommunityOperationStatus
  reason?: string
  payload: AuthSyncMessagePayload
}

export interface GeneratePublicKeysMessagePayload {
  teamId: string
  keys?: Keyset
}

export interface GeneratePublicKeysMessage extends BaseWebsocketMessage<GeneratePublicKeysMessagePayload> {
  ts: number
  status: CommunityOperationStatus
  reason?: string
  payload?: GeneratePublicKeysMessagePayload
}

export interface CommunitySignInPayload {
  teamId: string
  userId: string
}

export interface CommunitySignInMessage extends BaseWebsocketMessage<CommunitySignInPayload> {
  ts: number
  status: CommunityOperationStatus
  reason?: string
  payload?: CommunitySignInPayload
}

export interface QSSDataSyncPayload {
  teamId: string
  hash: string
  hashedDbId: string
  encEntry: EncryptedAndSignedPayload
}

export interface QSSDataSyncMessage extends BaseWebsocketMessage<QSSDataSyncPayload> {
  ts: number
  status: CommunityOperationStatus
  reason?: string
  payload: QSSDataSyncPayload
}
