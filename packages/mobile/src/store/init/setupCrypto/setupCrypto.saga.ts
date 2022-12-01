import CryptoEngine from 'pkijs/src/CryptoEngine'
import { setEngine } from 'pkijs/src/common'

import { io, Socket } from 'socket.io-client'

import { select, call, put, fork, takeEvery } from 'typed-redux-saga'

import { eventChannel } from 'redux-saga'

import { initSelectors } from '../init.selectors'
import { initActions } from '../init.slice'

import { CryptoDelegator } from './CryptoDelegator'
import { CryptoServiceResponse, SocketActionTypes } from '@quiet/state-manager'

let crypto: CryptoDelegator

export function* setupCryptoSaga(): Generator {
  const isCryptoEngineInitialized = yield* select(initSelectors.isCryptoEngineInitialized)
  if (!isCryptoEngineInitialized) {
    const servicePort = 1000 // Get from find free port

    yield* fork(startCryptoServiceConnection, servicePort)

    yield* call(initCryptoEngine)

    // Prevent initializing crypto engine twice
    yield* put(initActions.setCryptoEngineInitialized(true))
  }
}

export function* startCryptoServiceConnection(servicePort: number): Generator {
  const socket = yield* call(io, `http://localhost:${servicePort}`)
  // Proxy crypto calls to nodejs service
  crypto = new CryptoDelegator(socket)
  yield* fork(handleActions, socket)
}

function* handleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribe, socket)
  yield takeEvery(socketChannel, function* (payload: CryptoServiceResponse) {
    yield call(crypto.respond, payload)
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
  setEngine(
    'newEngine',
    // @ts-expect-error
    crypto,
    new CryptoEngine({
      name: '',
      crypto,
      subtle: crypto.subtle
    })
  )
}
