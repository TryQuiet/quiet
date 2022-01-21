import SocketIO from 'socket.io'
import { SocketActionTypes } from '@zbayapp/nectar'

class ErrorPayload {
  type: string
  message: string
  communityId?: string
}

export enum ErrorCodes {
  VALIDATION = 403,
  SERVER_ERROR = 500
}

export enum ErrorMessages {
  // Registrar
  REGISTRAR_CONNECTION_FAILED = 'Connecting to registrar failed',
  REGISTRAR_LAUNCH_FAILED = 'Could not launch registrar',
  REGISTRATION_FAILED = 'Registering username failed.',
  USERNAME_TAKEN = 'Username already taken.',
  INVALID_USERNAME = 'Username is not valid',

  // Community
  COMMUNITY_LAUNCH_FAILED = 'Could not launch community',

  // Network
  NETWORK_SETUP_FAILED = 'Creating network failed'
}

export class Error extends ErrorPayload {
  code: number
}

export const emitError = (io: SocketIO.Server, payload: Error) => {
  io.emit(SocketActionTypes.ERROR, payload)
}

export const emitValidationError = (io: SocketIO.Server, payload: ErrorPayload) => {
  emitError(io, { ...payload, code: ErrorCodes.VALIDATION })
}

export const emitServerError = (io: SocketIO.Server, payload: ErrorPayload) => {
  emitError(io, { ...payload, code: ErrorCodes.SERVER_ERROR })
}
