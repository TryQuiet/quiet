import SocketIO from 'socket.io'
import { ErrorCodes, ErrorPayload, SocketActionTypes } from '@quiet/nectar'

export const emitError = (io: SocketIO.Server, payload: ErrorPayload) => {
  io.emit(SocketActionTypes.ERROR, payload)
}

export const emitValidationError = (io: SocketIO.Server, payload: ErrorPayload) => {
  emitError(io, { ...payload, code: ErrorCodes.VALIDATION })
}

export const emitServerError = (io: SocketIO.Server, payload: ErrorPayload) => {
  emitError(io, { ...payload, code: ErrorCodes.SERVER_ERROR })
}
