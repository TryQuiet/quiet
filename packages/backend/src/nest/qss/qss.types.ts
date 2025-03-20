import { Keyset } from '@localfirst/auth'
import { CompoundError } from '@quiet/types'

/**
 * Quiet-specific websocket event types
 */
export enum WebsocketEvents {
  Handshake = 'handshake',
  CreateCommunity = 'create-community',
  UpdateCommunity = 'update-community',
  GetCommunity = 'get-community',
}

/**
 * Socket.io client-specific websocket events
 */
export enum NativeClientWebsocketEvents {
  Connect = 'connect',
  Disconnect = 'disconnect',
  Error = 'error',
  Reconnect = 'reconnect',
  Reconnecting = 'reconnecting',
  ReconnectAttempt = 'reconnect_attempt',
  ReconnectError = 'reconnect_error',
  ReconnectFailed = 'reconnect_failed',
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
  Error = 'error',
  Active = 'active',
  Success = 'success',
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
  Error = 'error',
  Success = 'success',
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
