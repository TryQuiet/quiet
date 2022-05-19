import SocketIO from 'socket.io'
import { ErrorPayload, SocketActionTypes } from '@quiet/nectar'

export const emitError = (io: SocketIO.Server, payload: ErrorPayload) => {
  io.emit(SocketActionTypes.ERROR, payload)
}
