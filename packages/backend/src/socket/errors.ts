import { type ErrorPayload, SocketActionTypes } from '@quiet/types'
import type SocketIO from 'socket.io'

export const emitError = (io: SocketIO.Server, payload: ErrorPayload) => {
  io.emit(SocketActionTypes.ERROR, payload)
}
