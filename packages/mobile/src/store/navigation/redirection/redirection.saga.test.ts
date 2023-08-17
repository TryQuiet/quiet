import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { FactoryGirl } from 'factory-girl'
import { getFactory, identity } from '@quiet/state-manager'
import { setupCrypto } from '@quiet/identity'

import { navigationActions } from '../navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

import { Store } from '../../store.types'
import { prepareStore } from '../../../tests/utils/prepareStore'
import { reducers } from '../../root.reducer'

import { redirectionSaga } from './redirection.saga'
import { initActions } from '../../init/init.slice'

describe('redirectionSaga', () => {
  let store: Store
  let factory: FactoryGirl

  beforeEach(async () => {
    setupCrypto()
    store = (await prepareStore()).store
    factory = await getFactory(store)
  })

  test('does nothing if app opened from url', async () => {
    store.dispatch(initActions.deepLink('bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd'))

    const reducer = combineReducers(reducers)
    await expectSaga(redirectionSaga)
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

  test("holds until websocket connects if user doesn't belong to a community", async () => {
    const reducer = combineReducers(reducers)

    await expectSaga(redirectionSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        navigationActions.replaceScreen({
          screen: ScreenNames.JoinCommunityScreen,
        })
      )
      .run()
  })

  test('redirect if user sees a splash screen being a member of community', async () => {
    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity')

    const reducer = combineReducers(reducers)
    await expectSaga(redirectionSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(navigationActions.replaceScreen({ screen: ScreenNames.ChannelListScreen }))
      .run()
  })
})
