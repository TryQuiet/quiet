import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { initActions, initReducer, InitState } from '../../init/init.slice'
import { StoreKeys } from '../../store.keys'
import { nativeServicesReducer, NativeServicesState } from '../nativeServices.slice'
import FindFreePort from 'react-native-find-free-port'

import { startNodeProcess, startWaggleSaga } from './startWaggle.saga'

describe('startWaggleSaga', () => {
  test('should start nodejs process', async () => {
    await expectSaga(startWaggleSaga)
      .withReducer(
        combineReducers({
          [StoreKeys.NativeServices]: nativeServicesReducer,
          [StoreKeys.Init]: initReducer
        }),
        {
          [StoreKeys.NativeServices]: {
            ...new NativeServicesState()
          },
          [StoreKeys.Init]: {
            ...new InitState(),
            dataDirectoryPath: 'dataDirectoryPath',
            torData: {
              httpTunnelPort: 8050,
              socksPort: 9010,
              controlPort: 9150,
              authCookie: 'cookie'
            }
          }
        }
      )
      .provide([
        [call.fn(FindFreePort.getFirstStartingFrom), 4677],
        [call.fn(startNodeProcess), null]
      ])
      .call(FindFreePort.getFirstStartingFrom, 4677)
      .call(startNodeProcess, 'dataDirectoryPath', 4677, 8050, 9010, 9150, 'cookie')
      .put(initActions.onWaggleStarted({ dataPort: 4677 }))
      .run()
  })
})
