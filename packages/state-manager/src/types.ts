import { Socket as IOSocket } from 'socket.io-client'
import { DefaultEventsMap } from 'socket.io-client/build/typed-events'
import { InitCommunityPayload, LaunchRegistrarPayload } from './sagas/communities/communities.types'
import {
  CancelDownloadPayload,
  DownloadFilePayload,
  UploadFilePayload
} from './sagas/files/files.types'
import {
  RegisterOwnerCertificatePayload,
  RegisterUserCertificatePayload,
  SaveOwnerCertificatePayload
} from './sagas/identity/identity.types'
import { messagesActions } from './sagas/messages/messages.slice'
import { SendMessagePayload } from './sagas/messages/messages.types'
import { publicChannelsActions } from './sagas/publicChannels/publicChannels.slice'
import { SocketActionTypes } from './sagas/socket/const/actionTypes'

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
  [SocketActionTypes.ASK_FOR_MESSAGES]: EmitEvent<
    ReturnType<typeof messagesActions.askForMessages>['payload']
  >
  [SocketActionTypes.CREATE_CHANNEL]: EmitEvent<
    ReturnType<typeof publicChannelsActions.createChannel>['payload']
  >
  [SocketActionTypes.CLOSE]: () => void
}

export type Socket = IOSocket<DefaultEventsMap, EmitEvents>

export type ApplyEmitParams<T extends keyof EmitEvents, P> = [a: T, p: P]
export const applyEmitParams = <T extends keyof EmitEvents, P>(
  eventType: T,
  payload: P
): ApplyEmitParams<T, P> => [eventType, payload]
