import { type Socket as IOSocket } from 'socket.io-client'
import { SocketEventsMap, SocketActionsMap } from '@quiet/types'

export type Socket = IOSocket<SocketEventsMap, SocketActionsMap>

export type ApplyEmitParams<T extends keyof SocketActionsMap> = [a: T, p: Parameters<SocketActionsMap[T]>[0]]

export const applyEmitParams = <T extends keyof SocketActionsMap>(
  eventType: T,
  payload: Parameters<SocketActionsMap[T]>[0]
): ApplyEmitParams<T> => [eventType, payload]
