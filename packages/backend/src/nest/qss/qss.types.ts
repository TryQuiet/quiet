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
  LOG_ENTRY_PULL = 'log-entry-pull',
  VERIFY_CAPTCHA = 'verify-captcha',
  GET_CAPTCHA_SITE_KEY = 'get-captcha-site-key',
  REGISTER_DEVICE_TOKEN = 'register-device-token',
  SEND_PUSH = 'qps-send-push',
  SEND_BATCH_PUSH = 'qps-send-batch-push',
}

/**
 * Event emitter events
 */
export enum QSSEvents {
  QSS_AUTH_JOINED = 'qssAuthJoined',
  QSS_AUTH_ERROR = 'qssAuthError',
  QSS_SELF_ASSIGN_MEMBER = 'qssSelfAssignMember',
  QSS_FULLY_JOINED = 'qssFullyJoined',
  QSS_CONNECTED = 'qssConnected',
  QSS_DISCONNECTED = 'qssDisconnected',
  QSS_HANDLE_SIGN_IN = 'qssHandleSignIn',
  QSS_CAPTCHA_VERIFIED = 'qssCaptchaVerified',
  QSS_CAPTCHA_REQUIRED = 'qssCaptchaRequired',
  QSS_START_AUTH_CONN = 'qssStartAuthConn',
  QSS_AUTH_CONNECTED = 'qssAuthConnected',
  QSS_LOG_SYNCED = 'qssLogSynced',
}

export interface QSSAuthErrorPayload {
  teamId: string
  error: Error
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
  deviceId: string
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
  deviceId: string
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
  deviceId: string
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
  receivedAt?: number
  syncSeq?: number
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
  receivedAt?: number
  syncSeq?: number
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
  cursor?: string
  startSeq?: number
  endSeq?: number
  startTs?: number
  endTs?: number
  limit?: number
  hash?: string
  hashedDbId?: string
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
  highestSyncSeq?: number
  resolvedStartSeq?: number
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

export interface SendPushPayload {
  ucan: string
  title?: string
  body?: string
  data?: Record<string, string>
}

export interface SendPushMessage extends BaseWebsocketMessage<SendPushPayload> {
  payload: SendPushPayload
}

export interface SendPushResponse extends BaseWebsocketMessage<undefined> {}

export interface SendBatchPushPayload {
  ucans: string[]
  title?: string
  body?: string
  data?: Record<string, string>
}

export interface SendBatchPushMessage extends BaseWebsocketMessage<SendBatchPushPayload> {
  payload: SendBatchPushPayload
}

export interface SendBatchPushResponsePayload {
  invalidTokens: string[]
}

export interface SendBatchPushResponse extends BaseWebsocketMessage<SendBatchPushResponsePayload> {}
