import { type Socket as IOSocket } from 'socket.io-client'
import { type messagesActions } from './sagas/messages/messages.slice'
import { type publicChannelsActions } from './sagas/publicChannels/publicChannels.slice'
import {
  type SaveCSRPayload,
  type CancelDownloadPayload,
  type Community,
  type CreateChannelPayload,
  type CreateChannelResponse,
  type DeleteFilesFromChannelSocketPayload,
  type DownloadFilePayload,
  type GetMessagesPayload,
  type InitCommunityPayload,
  type MessagesLoadedPayload,
  type RegisterOwnerCertificatePayload,
  type RegisterUserCertificatePayload,
  type SaveOwnerCertificatePayload,
  type SendMessagePayload,
  type SocketActionTypes,
  type UploadFilePayload,
  type CommunityMetadata,
  type PermsData,
  type UserProfile,
  type DeleteChannelResponse,
} from '@quiet/types'

interface EventsMap {
  [event: string]: (...args: any[]) => void
}

type EmitEvent<Payload, Callback = (response: any) => void> = (payload: Payload, callback?: Callback) => void

export interface EmitEvents {
  [SocketActionTypes.LAUNCH_COMMUNITY]: EmitEvent<InitCommunityPayload>
  [SocketActionTypes.DOWNLOAD_FILE]: EmitEvent<DownloadFilePayload>
  [SocketActionTypes.SEND_MESSAGE]: EmitEvent<SendMessagePayload>
  [SocketActionTypes.CANCEL_DOWNLOAD]: EmitEvent<CancelDownloadPayload>
  [SocketActionTypes.UPLOAD_FILE]: EmitEvent<UploadFilePayload>
  [SocketActionTypes.REGISTER_OWNER_CERTIFICATE]: EmitEvent<RegisterOwnerCertificatePayload>
  [SocketActionTypes.REGISTER_USER_CERTIFICATE]: EmitEvent<RegisterUserCertificatePayload>
  [SocketActionTypes.CREATE_COMMUNITY]: EmitEvent<InitCommunityPayload>
  [SocketActionTypes.GET_MESSAGES]: EmitEvent<GetMessagesPayload, (response?: MessagesLoadedPayload) => void>
  [SocketActionTypes.CREATE_CHANNEL]: EmitEvent<CreateChannelPayload, (response?: CreateChannelResponse) => void>
  [SocketActionTypes.DELETE_CHANNEL]: EmitEvent<
    ReturnType<typeof publicChannelsActions.deleteChannel>['payload'],
    (response: DeleteChannelResponse) => void
  >
  [SocketActionTypes.DELETE_FILES_FROM_CHANNEL]: EmitEvent<DeleteFilesFromChannelSocketPayload>
  [SocketActionTypes.CLOSE]: () => void
  [SocketActionTypes.LEAVE_COMMUNITY]: () => void
  [SocketActionTypes.CREATE_NETWORK]: EmitEvent<Community>
  [SocketActionTypes.SEND_CSR]: EmitEvent<SaveCSRPayload>
  [SocketActionTypes.SEND_COMMUNITY_METADATA]: EmitEvent<CommunityMetadata, (response: CommunityMetadata) => void>
  [SocketActionTypes.SEND_COMMUNITY_CA_DATA]: EmitEvent<PermsData>
  [SocketActionTypes.SEND_USER_PROFILE]: EmitEvent<UserProfile>
}

export type Socket = IOSocket<EventsMap, EmitEvents>

export type ApplyEmitParams<T extends keyof EmitEvents, P> = [a: T, p: P]

export const applyEmitParams = <T extends keyof EmitEvents, P>(eventType: T, payload: P): ApplyEmitParams<T, P> => [
  eventType,
  payload,
]
