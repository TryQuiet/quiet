import { BaseWebsocketMessage } from '../qss/qss.types'

export interface QPSRegisterRequest {
  deviceToken: string
  bundleId: string
}

export interface QPSRegisterResponse {
  ucan: string
}

export interface QPSRegisterPayload {
  deviceToken: string
  bundleId: string
}

export interface QPSRegisterMessage extends BaseWebsocketMessage<QPSRegisterPayload> {
  payload: QPSRegisterPayload
}

export interface QPSRegisterResponsePayload {
  ucan: string
}

export interface QPSRegisterWsResponse extends BaseWebsocketMessage<QPSRegisterResponsePayload> {
  payload?: QPSRegisterResponsePayload
}
