import { expectSaga } from 'redux-saga-test-plan'
import { onConnectedSaga } from './onConnected.saga'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../root.reducer'
import { prepareStore } from '../../../tests/utils/prepareStore'
import { initActions } from '../init.slice'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

describe('onConnectedSaga', () => {
  test('does nothing if app opened from url', async () => {
    const { store } = await prepareStore()

    store.dispatch(initActions.deepLink('bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd'))

    const reducer = combineReducers(reducers)
    await expectSaga(onConnectedSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        navigationActions.replaceScreen({
          screen: ScreenNames.JoinCommunityScreen,
        })
      )
      .not.put(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelListScreen,
        })
      )
      .run()
  })
})
