import { createAction } from '@reduxjs/toolkit'
import { ActionsType, Socket } from '../const/actionsTypes'
export type CertificatesActions = ActionsType<typeof certificatesActions>

export const certificatesActions = {
  responseGetCertificates: createAction<{ certificates: string[] }, Socket.RESPONSE_GET_CERTIFICATES>(Socket.RESPONSE_GET_CERTIFICATES),
  saveCertificate: createAction(Socket.SAVE_CERTIFICATE)
}
