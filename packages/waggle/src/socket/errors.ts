import SocketIO from 'socket.io'
import { SocketActionTypes } from '@quiet/nectar'

class ErrorPayload {
  type: string
  message: string
  communityId?: string
}

export class Error extends ErrorPayload {
  code: number
}

export const emitError = (io: SocketIO.Server, payload: Error) => {
  io.emit(SocketActionTypes.ERROR, payload)
}

export const emitValidationError = (io: SocketIO.Server, payload: ErrorPayload) => {
  emitError(io, { ...payload, code: 403 })
}

export const emitServerError = (io: SocketIO.Server, payload: ErrorPayload) => {
  emitError(io, { ...payload, code: 500 })
}
