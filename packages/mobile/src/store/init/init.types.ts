import { Socket } from '@quiet/state-manager'

export interface InitCheck {
  event: string
  passed: boolean
}

export interface WebsocketConnectionPayload {
  dataPort: number
  socketIOSecret: string
}

export interface ActiveWebsocketConnection {
  socket: Socket
  socketIOData: WebsocketConnectionPayload
}
