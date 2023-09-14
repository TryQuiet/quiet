import { type Socket as IOSocket } from 'socket.io-client'
import { type DefaultEventsMap } from 'socket.io-client/build/typed-events'
import { type messagesActions } from './sagas/messages/messages.slice'
import { type publicChannelsActions } from './sagas/publicChannels/publicChannels.slice'
import {
  SaveCSRPayload,
  type CancelDownloadPayload,
  type Community,
  type DeleteFilesFromChannelSocketPayload,
  type DownloadFilePayload,
  type InitCommunityPayload,
  type LaunchRegistrarPayload,
  type RegisterOwnerCertificatePayload,
  type RegisterUserCertificatePayload,
  type SaveOwnerCertificatePayload,
  type SendMessagePayload,
  type SocketActionTypes,
  type UploadFilePayload,
  CommunityMetadata,
} from '@quiet/types'

type EmitEvent<Payload> = (payload: Payload) => void

export interface EmitEvents {
  [SocketActionTypes.LAUNCH_REGISTRAR]: EmitEvent<LaunchRegistrarPayload>
  [SocketActionTypes.LAUNCH_COMMUNITY]: EmitEvent<InitCommunityPayload>
  [SocketActionTypes.DOWNLOAD_FILE]: EmitEvent<DownloadFilePayload>
  [SocketActionTypes.SEND_MESSAGE]: EmitEvent<SendMessagePayload>
  [SocketActionTypes.CANCEL_DOWNLOAD]: EmitEvent<CancelDownloadPayload>
  [SocketActionTypes.UPLOAD_FILE]: EmitEvent<UploadFilePayload>
  [SocketActionTypes.SAVE_OWNER_CERTIFICATE]: EmitEvent<SaveOwnerCertificatePayload>
  [SocketActionTypes.REGISTER_OWNER_CERTIFICATE]: EmitEvent<RegisterOwnerCertificatePayload>
  [SocketActionTypes.REGISTER_USER_CERTIFICATE]: EmitEvent<RegisterUserCertificatePayload>
  [SocketActionTypes.CREATE_COMMUNITY]: EmitEvent<InitCommunityPayload>
  [SocketActionTypes.ASK_FOR_MESSAGES]: EmitEvent<ReturnType<typeof messagesActions.askForMessages>['payload']>
  [SocketActionTypes.CREATE_CHANNEL]: EmitEvent<ReturnType<typeof publicChannelsActions.createChannel>['payload']>
  [SocketActionTypes.DELETE_CHANNEL]: EmitEvent<ReturnType<typeof publicChannelsActions.deleteChannel>['payload']>
  [SocketActionTypes.DELETE_FILES_FROM_CHANNEL]: EmitEvent<DeleteFilesFromChannelSocketPayload>
  [SocketActionTypes.CLOSE]: () => void
  [SocketActionTypes.LEAVE_COMMUNITY]: () => void
  [SocketActionTypes.CREATE_NETWORK]: EmitEvent<Community>
  [SocketActionTypes.SAVE_USER_CSR]: EmitEvent<SaveCSRPayload>
  [SocketActionTypes.SEND_COMMUNITY_METADATA]: EmitEvent<CommunityMetadata>
}

export type Socket = IOSocket<DefaultEventsMap, EmitEvents>

export type ApplyEmitParams<T extends keyof EmitEvents, P> = [a: T, p: P]
export const applyEmitParams = <T extends keyof EmitEvents, P>(eventType: T, payload: P): ApplyEmitParams<T, P> => [
  eventType,
  payload,
]
