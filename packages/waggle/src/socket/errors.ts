import SocketIO from 'socket.io'
import { ErrorCodes, ErrorPayload, ErrorPayloadData } from '@zbayapp/nectar'



export const emitError = (io: SocketIO.Server, payload: ErrorPayload) => {
  io.emit('error', payload)
}

export const emitValidationError = (io: SocketIO.Server, payload: ErrorPayloadData) => {
  emitError(io, { ...payload, code: ErrorCodes.VALIDATION })
}

export const emitServerError = (io: SocketIO.Server, payload: ErrorPayloadData) => {
  emitError(io, { ...payload, code: ErrorCodes.SERVER_ERROR })
}
