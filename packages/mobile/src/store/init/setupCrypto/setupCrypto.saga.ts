import { CryptoEngine, setEngine } from 'pkijs'

import { io, Socket } from 'socket.io-client'

import { PayloadAction } from '@reduxjs/toolkit/dist/createAction'
import { call, put, fork, takeEvery } from 'typed-redux-saga'

import { eventChannel } from 'redux-saga'

import { initActions } from '../init.slice'

import { CryptoDelegator } from './CryptoDelegator'
import { CryptoServiceResponse, SocketActionTypes } from '@quiet/state-manager'

export function* setupCryptoSaga(
  action: PayloadAction<ReturnType<typeof initActions.setupCrypto>['payload']>
): Generator {
  const servicePort = action.payload.cryptoPort
  yield* fork(startCryptoServiceConnection, servicePort)
}

export function* startCryptoServiceConnection(servicePort: number): Generator {
  const socket = yield* call(io, `http://localhost:${servicePort}`)

  // Proxy crypto calls to nodejs service
  const delegator = new CryptoDelegator(socket)
  yield* takeEvery(initActions.initializeCryptoEngine.type, initCryptoEngineSaga, delegator)

  yield* takeEvery(
    initActions.handleCryptoServiceResponse.type,
    handleCryptoServiceResponseSaga,
    delegator
  )

  yield* fork(handleActions, socket)
}

function* handleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribe, socket)
  yield takeEvery(socketChannel, function* (action) {
    yield put(action)
  })
}

function subscribe(socket?: Socket) {
  return eventChannel<
    | ReturnType<typeof initActions.initializeCryptoEngine>
    | ReturnType<typeof initActions.handleCryptoServiceResponse>
  >(emit => {
    socket?.on('connect', () => {
      console.log('crypto service websocket connected')
      emit(initActions.initializeCryptoEngine())
    })
    socket?.on('disconnect', () => {
      console.log('closing crypto service websocket connection')
    })
    socket?.on(SocketActionTypes.CRYPTO_SERVICE_RESPONSE, (payload: CryptoServiceResponse) => {
      emit(initActions.handleCryptoServiceResponse(payload))
    })
    return () => {}
  })
}

function* handleCryptoServiceResponseSaga(
  delegator: CryptoDelegator,
  action: PayloadAction<ReturnType<typeof initActions.handleCryptoServiceResponse>['payload']>
): Generator {
  const payload = action.payload
  yield* call([delegator, delegator.respond], payload)
}

function* initCryptoEngineSaga(delegator: CryptoDelegator): Generator {
  yield* call(initCryptoEngine, delegator)
}

export const initCryptoEngine = (delegator: CryptoDelegator) => {
  setEngine(
    'newEngine',
    // @ts-expect-error
    delegator,
    new CryptoEngine({
      name: '',
      delegator,
      subtle: delegator.subtle
    })
  )
}
