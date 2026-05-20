import { BaseWebsocketMessage } from '../qss/qss.types'

export interface QPSRegisterPayload {
  deviceToken: string
  bundleId: string
  platform: 'ios' | 'android'
  teamId: string
}

export interface QPSRegisterMessage extends BaseWebsocketMessage<QPSRegisterPayload> {
  payload: QPSRegisterPayload
}

export interface QPSRegisterResponsePayload {
  ucan: string
}

export interface QPSRegisterResponse extends BaseWebsocketMessage<QPSRegisterResponsePayload> {
  payload?: QPSRegisterResponsePayload
}
