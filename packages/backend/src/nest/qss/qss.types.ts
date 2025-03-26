import { Keyset } from '3rd-party/auth/packages/auth/dist'
import { CompoundError } from '@quiet/types'

/**
 * Quiet-specific websocket event types
 */
export enum WebsocketEvents {
  HANDSHAKE = 'handshake',
  CREATE_COMMUNITY = 'create-community',
  UPDATE_COMMUNITY = 'update-community',
  GET_COMMUNITY = 'get-community',
  AUTH_SYNC = 'auth-sync',
  GEN_PUB_KEYS = 'generate-public-keys',
  SIGN_IN_COMMUNITY = 'sign-in-community',
}

/**
 * Event emitter events
 */
export enum QSSEvents {
  QSS_AUTH_JOINED = 'qssAuthJoined',
}

export interface BaseWebsocketMessage<T extends object | undefined> {
  ts: number
  payload: T
}

export interface BaseStatusPayload<T extends object | undefined> {
  status: string
  reason?: string
  payload?: T
}

export enum HandshakeStatus {
  ERROR = 'error',
  ACTIVE = 'active',
  SUCCESS = 'success',
}

export interface InnerHandshakePayload {
  publicKey: string
}
export interface HandshakePayload extends BaseStatusPayload<InnerHandshakePayload> {
  status: HandshakeStatus
  reason?: string
  payload?: InnerHandshakePayload
}

export interface HandshakeMessage extends BaseWebsocketMessage<HandshakePayload> {
  ts: number
  payload: HandshakePayload
}

export interface QSSCommunity {
  teamId: string
  name: string
  peerList: string[]
  psk: string
  sigChain: string
}

export interface CreateCommunityPayload {
  community: QSSCommunity
  teamKeyring: string
}

export interface CreateCommunity {
  ts: number
  payload: CreateCommunityPayload
}

export enum CreateCommunityStatus {
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface CreateCommunityResponseInnerPayload {
  serverKeys: Keyset
}

export interface CreateCommunityResponsePayload extends BaseStatusPayload<CreateCommunityResponseInnerPayload> {
  status: CreateCommunityStatus
  reason?: string
  payload?: CreateCommunityResponseInnerPayload
}
export interface CreateCommunityResponse extends BaseWebsocketMessage<CreateCommunityResponsePayload> {
  ts: number
  payload: CreateCommunityResponsePayload
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
  UNAUTHORIZED = 'unauthorized',
  NOT_FOUND = 'not found',
}

export interface AuthSyncMessageInnerPayload {
  teamId: string
  message: string
}
export interface AuthSyncMessagePayload extends BaseStatusPayload<AuthSyncMessageInnerPayload> {
  status: CommunityOperationStatus
  reason?: string
  payload?: AuthSyncMessageInnerPayload
}

export interface AuthSyncMessage extends BaseWebsocketMessage<AuthSyncMessagePayload> {
  ts: number
  payload: AuthSyncMessagePayload
}

export interface GeneratePublicKeysMessagePayload {
  teamId: string
}

export interface GeneratePublicKeysMessage {
  ts: number
  payload: GeneratePublicKeysMessagePayload
}

export interface GeneratePublicKeysResponseInnerPayload {
  teamId: string
  keys: Keyset
}

export interface GeneratePublicKeysResponsePayload extends BaseStatusPayload<GeneratePublicKeysResponseInnerPayload> {
  status: CommunityOperationStatus
  reason?: string
  payload?: GeneratePublicKeysResponseInnerPayload
}

export interface GeneratePublicKeysResponse extends BaseWebsocketMessage<GeneratePublicKeysResponsePayload> {
  ts: number
  payload: GeneratePublicKeysResponsePayload
}

export interface CommunitySignInInnerPayload {
  teamId: string
}

export interface CommunitySignInPayload extends BaseStatusPayload<CommunitySignInInnerPayload> {
  status: CommunityOperationStatus
  reason?: string
  payload?: CommunitySignInInnerPayload
}

export interface CommunitySignInMessage extends BaseWebsocketMessage<CommunitySignInPayload> {
  ts: number
  payload: CommunitySignInPayload
}
