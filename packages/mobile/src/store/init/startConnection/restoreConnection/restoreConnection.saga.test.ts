import { socket } from '@quiet/state-manager'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { StoreKeys } from '../../../store.keys'
import { initActions, initReducer, InitState } from '../../init.slice'
import { restoreConnectionSaga } from './restoreConnection.saga'

describe('restoreConnectionSaga', () => {
  test('do nothing if connection is already started', async () => {
    const socketIOData = {
      dataPort: 9477,
      socketIOSecret: 'secret',
    }
    await expectSaga(restoreConnectionSaga)
      .withReducer(combineReducers({ [StoreKeys.Init]: initReducer }), {
        [StoreKeys.Init]: {
          ...new InitState(),
          isWebsocketConnected: true,
          lastKnownSocketIOData: socketIOData,
        },
      })
      .not.put(initActions.startWebsocketConnection(socketIOData))
      .run()
  })
  test('do nothing if last known data port is not set', async () => {
    const socketIOData = {
      dataPort: 0,
      socketIOSecret: 'secret',
    }
    await expectSaga(restoreConnectionSaga)
      .withReducer(combineReducers({ [StoreKeys.Init]: initReducer }), {
        [StoreKeys.Init]: {
          ...new InitState(),
          isWebsocketConnected: false,
          lastKnownSocketIOData: socketIOData,
        },
      })
      .not.put(initActions.startWebsocketConnection(socketIOData))
      .run()
  })
})
