import CryptoEngine from 'pkijs/src/CryptoEngine'
import { setEngine } from 'pkijs/src/common'

import { io, Socket } from 'socket.io-client'

import { PayloadAction } from '@reduxjs/toolkit/dist/createAction'
import { select, call, put, fork, takeEvery, delay } from 'typed-redux-saga'

import { eventChannel } from 'redux-saga'

import { initSelectors } from '../init.selectors'
import { initActions } from '../init.slice'

import { CryptoDelegator } from './CryptoDelegator'
import { CryptoServiceResponse, SocketActionTypes } from '@quiet/state-manager'

let cryptoDelegator: CryptoDelegator

export function* setupCryptoSaga(action: PayloadAction<ReturnType<typeof initActions.setupCrypto>['payload']>): Generator {
  const isCryptoEngineInitialized = yield* select(initSelectors.isCryptoEngineInitialized)
  if (!isCryptoEngineInitialized) {
    const servicePort = action.payload.cryptoPort
    yield* fork(startCryptoServiceConnection, servicePort)

    while (true) {
      if (cryptoDelegator) {
        // Initialize crypto engine with nodejs proxy
        yield* call(initCryptoEngine)
        // Prevent initializing crypto engine twice
        yield* put(initActions.setCryptoEngineInitialized(true))
        break
      }
      yield* delay(500)
    }
  }
}

export function* startCryptoServiceConnection(servicePort: number): Generator {
  const socket = yield* call(io, `http://localhost:${servicePort}`)
  // Proxy crypto calls to nodejs service
  cryptoDelegator = new CryptoDelegator(socket)
  yield* fork(handleActions, socket)
}

function* handleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribe, socket)
  yield takeEvery(socketChannel, function* (payload: CryptoServiceResponse) {
    yield call(cryptoDelegator.respond, payload)
  })
}

function subscribe(socket?: Socket) {
  return eventChannel<CryptoServiceResponse>(emit => {
    socket?.on('connect', () => {
      console.log('crypto service websocket connected')
    })
    socket?.on('disconnect', () => {
      console.log('closing crypto service websocket connection')
    })
    socket?.on(
      SocketActionTypes.CRYPTO_SERVICE_RESPONSE,
      (payload: CryptoServiceResponse) => {
        emit(payload)
      }
    )
    return () => {}
  })
}

export const initCryptoEngine = () => {
  console.log(JSON.stringify(cryptoDelegator.subtle)) // WIP
  setEngine(
    'newEngine',
    // @ts-expect-error
    cryptoDelegator,
    new CryptoEngine({
      name: '',
      cryptoDelegator,
      subtle: cryptoDelegator.subtle
    })
  )
}
