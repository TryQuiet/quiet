import type SocketIO from 'socket.io'
import { ErrorPayload, SocketActionTypes } from '@quiet/state-manager'

export const emitError = (io: SocketIO.Server, payload: ErrorPayload) => {
  io.emit(SocketActionTypes.ERROR, payload)
}
