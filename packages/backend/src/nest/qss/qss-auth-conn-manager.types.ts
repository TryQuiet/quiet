import { type Socket as ClientSocket } from 'socket.io-client'

import { type AuthSyncMessage } from './qss.types'

export interface PendingAuthSyncFrame {
  clientSocket: ClientSocket
  message: AuthSyncMessage
}
