import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigate } from '../../../RootNavigation'
import { StoreKeys } from '../../store.keys'
import { initReducer, InitState } from '../../init/init.slice'
import { navigationReducer, NavigationState } from '../navigation.slice'

import { redirectionSaga } from './redirection.saga'

describe('redirectionSaga', () => {
  test('display proper screen on app start', () => {
    expectSaga(redirectionSaga)
      .withReducer(combineReducers({ [StoreKeys.Init]: initReducer, [StoreKeys.Navigation]: navigationReducer }), {
        [StoreKeys.Init]: {
          ...new InitState()
        },
        [StoreKeys.Navigation]: {
            ...new NavigationState(),
            currentScreen: ScreenNames.ChannelScreen
          }
      })
      .call(navigate, ScreenNames.ChannelScreen)
  })
})
