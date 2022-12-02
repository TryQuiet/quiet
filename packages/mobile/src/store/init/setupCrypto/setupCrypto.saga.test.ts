import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { StoreKeys } from '../../store.keys'
import { initActions, initReducer, InitState } from '../init.slice'
import { initCryptoEngine, setupCryptoSaga } from './setupCrypto.saga'

describe('setupCryptoSaga', () => {
  test('sets crypto engine', async () => {
    await expectSaga(setupCryptoSaga, initActions.setupCrypto({
        cryptoPort: 1000
    }))
      .withReducer(combineReducers({ [StoreKeys.Init]: initReducer }), {
        [StoreKeys.Init]: {
          ...new InitState()
        }
      })
      .provide([
        [call.fn(initCryptoEngine), null]
      ])
      .call(initCryptoEngine)
      .put(initActions.setCryptoEngineInitialized(true))
      .hasFinalState({
        [StoreKeys.Init]: {
          ...new InitState(),
          isCryptoEngineInitialized: true
        }
      })
      .run()
  })
})
