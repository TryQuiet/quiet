import { combineReducers } from '@reduxjs/toolkit'
import { NativeModules } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { StoreKeys } from '../../store.keys'
import { nativeServicesReducer, NativeServicesState } from '../nativeServices.slice'

import { createDataDirectorySaga } from './createDataDirectory.saga'

describe('createDataDirectorySaga', () => {
  test('should create data directory with native method', async () => {
    NativeModules.TorModule = {
      createDataDirectory: jest.fn()
    }
    await expectSaga(createDataDirectorySaga)
      .withReducer(combineReducers({ [StoreKeys.NativeServices]: nativeServicesReducer }), {
        [StoreKeys.NativeServices]: {
          ...new NativeServicesState()
        }
      })
      .call(NativeModules.TorModule.createDataDirectory)
      .run()
  })
})
