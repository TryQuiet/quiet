import { Keyset } from '3rd-party/auth/packages/auth/dist'
import { Community, CompoundError } from '@quiet/types'
import { EncryptedAndSignedPayload } from '../auth/services/crypto/types'
export enum ReprocessableOperation {
  CREATE_COMMUNITY = 'CREATE_COMMUNITY',
  SIGN_IN = 'SIGN_IN',
}

/**
 * Config for operations that need to be reprocessed
 */
export interface ReprocessableOperationDescription {
  teamId: string
  operation: ReprocessableOperation
  arguments: Parameters<any>
}

/**
 * Quiet-specific websocket event types
 */
export enum WebsocketEvents {
  CREATE_COMMUNITY = 'create-community',
  GET_COMMUNITY = 'get-community',
  AUTH_SYNC = 'auth-sync',
  GEN_PUB_KEYS = 'generate-public-keys',
  SIGN_IN_COMMUNITY = 'sign-in-community',
  LOG_ENTRY_SYNC = 'log-entry-sync',
  LOG_ENTRY_FANOUT = 'log-entry-fanout',
  LOG_ENTRY_PULL = 'log-entry-pull',
  VERIFY_CAPTCHA = 'verify-captcha',
  GET_CAPTCHA_SITE_KEY = 'get-captcha-site-key',
}

/**
 * Event emitter events
 */
export enum QSSEvents {
  QSS_AUTH_JOINED = 'qssAuthJoined',
  QSS_CONNECTED = 'qssConnected',
  QSS_DISCONNECTED = 'qssDisconnected',
  QSS_HANDLE_SIGN_IN = 'qssHandleSignIn',
  QSS_CAPTCHA_VERIFIED = 'qssCaptchaVerified',
  QSS_CAPTCHA_REQUIRED = 'qssCaptchaRequired',
  QSS_START_AUTH_CONN = 'qssStartAuthConn',
}

export enum QSSOperationResult {
  DISABLED = 'DISABLED',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

export interface QSSInitStatus {
  communityInitialized: boolean
  qssEnabled: boolean
  qssSetup: boolean
  community?: Community
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
  hcaptchaToken?: string
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

export interface LogEntrySyncPayload {
  teamId: string
  hash: string
  hashedDbId: string
  encEntry: EncryptedAndSignedPayload
}

export interface LogEntrySyncMessage extends BaseWebsocketMessage<LogEntrySyncPayload> {
  ts: number
  status: CommunityOperationStatus
  reason?: string
  payload: LogEntrySyncPayload
}

export interface LogEntrySyncResponsePayload {
  teamId: string
  hash: string
  hashedDbId: string
}

export interface LogEntrySyncResponseMessage extends BaseWebsocketMessage<LogEntrySyncResponsePayload> {
  ts: number
  status: CommunityOperationStatus
  reason?: string
  payload: LogEntrySyncResponsePayload
}

export interface LogEntryPullPayload {
  teamId: string
  userId: string
  direction?: 'forward' | 'backward'
  startTs?: number
  endTs?: number
  limit?: number
  hash?: string
  hashedDbId?: string
  cursor?: string
}

export interface LogEntryPullMessage extends BaseWebsocketMessage<LogEntryPullPayload> {
  ts: number
  status: CommunityOperationStatus
  reason?: string
  payload: LogEntryPullPayload
}

export interface LogEntryPullResponsePayload {
  cursor?: string
  hasNextPage: boolean
  entries: Buffer[]
}

export interface LogEntryPullResponseMessage extends BaseWebsocketMessage<LogEntryPullResponsePayload> {
  ts: number
  status: CommunityOperationStatus
  reason?: string
  payload: LogEntryPullResponsePayload
}

export interface CaptchaVerifyPayload {
  token: string
}

export interface CaptchaVerifyMessage extends BaseWebsocketMessage<CaptchaVerifyPayload> {
  payload: CaptchaVerifyPayload
}

export interface CaptchaVerifyResponse extends BaseWebsocketMessage<undefined> {}

export interface GetCaptchaSiteKeyMessage extends BaseWebsocketMessage<undefined> {}

export interface GetCaptchaSiteKeyResponsePayload {
  siteKey: string
}

export interface GetCaptchaSiteKeyResponse extends BaseWebsocketMessage<GetCaptchaSiteKeyResponsePayload> {
  payload?: GetCaptchaSiteKeyResponsePayload
}
