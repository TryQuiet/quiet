import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { StoreKeys } from '../../../store.keys'
import { initActions, initReducer, InitState } from '../../init.slice'
import { restoreConnectionSaga } from './restoreConnection.saga'

describe('restoreConnectionSaga', () => {
  test('do nothing if connection is already started', async () => {
    await expectSaga(restoreConnectionSaga)
    .withReducer(combineReducers({ [StoreKeys.Init]: initReducer }), {
        [StoreKeys.Init]: {
          ...new InitState(),
          isWebsocketConnected: true,
          lastKnownDataPort: 9477
        }
      })
      .not.put(initActions.startWebsocketConnection({
        dataPort: 9477
      }))
      .run()
  })
  test('do nothing if last known data port is not set', async () => {
    await expectSaga(restoreConnectionSaga)
    .withReducer(combineReducers({ [StoreKeys.Init]: initReducer }), {
        [StoreKeys.Init]: {
          ...new InitState(),
          isWebsocketConnected: false,
          lastKnownDataPort: 0
        }
      })
      .not.put(initActions.startWebsocketConnection({
        dataPort: 0
      }))
      .run()
  })
})
