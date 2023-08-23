import { SaveCSRPayload, SocketActionTypes } from '@quiet/types'
import { applyEmitParams, type Socket } from '../../../types'
import { PayloadAction } from '@reduxjs/toolkit'
import { apply, select } from 'typed-redux-saga'
import { identitySelectors } from '../identity.selectors'

export function* saveUserCsrSaga(socket: Socket): Generator {
  console.log('SAVE USER CSR SAGA')
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity?.userCsr) {
    console.error('saveUserCsrSaga NO IDENTITY')
    return
  }
  const payload: SaveCSRPayload = {
    csr: identity.userCsr?.userCsr,
  }
  console.log('SENDING SAVE_USER_CSR')
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.SAVE_USER_CSR, payload))
}
